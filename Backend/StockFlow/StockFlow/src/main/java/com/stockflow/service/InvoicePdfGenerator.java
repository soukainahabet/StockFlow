package com.stockflow.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.stockflow.model.Invoice;
import com.stockflow.model.LigneVente;
import com.stockflow.model.Vente;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Builds a clean A4 PDF for an invoice using OpenPDF.
 *
 * Layout:
 *   - Header: brand + invoice title + invoice number
 *   - Two columns: Issuer (StockFlow) vs Bill-to (customer)
 *   - Issued-by + issue date
 *   - Line items table
 *   - Total block aligned right
 *   - Optional notes + footer
 */
@Component
public class InvoicePdfGenerator {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMMM yyyy", Locale.FRENCH);

    private static final Color ACCENT = new Color(79, 70, 229);   // indigo-600
    private static final Color MUTED = new Color(100, 116, 139);  // slate-500
    private static final Color BORDER = new Color(226, 232, 240); // slate-200
    private static final Color SOFT_BG = new Color(248, 250, 252);// slate-50

    private static final Font TITLE_FONT =
            FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Color.BLACK);
    private static final Font H2_FONT =
            FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.BLACK);
    private static final Font LABEL_FONT =
            FontFactory.getFont(FontFactory.HELVETICA, 9, MUTED);
    private static final Font BODY_FONT =
            FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
    private static final Font BODY_BOLD =
            FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);
    private static final Font INVOICE_NUMBER_FONT =
            FontFactory.getFont(FontFactory.COURIER_BOLD, 12, ACCENT);
    private static final Font TOTAL_FONT =
            FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, Color.BLACK);
    private static final Font SMALL_MUTED =
            FontFactory.getFont(FontFactory.HELVETICA, 8, MUTED);

    public byte[] render(Invoice invoice) {
        if (invoice.getVente() == null) {
            throw new IllegalStateException("Invoice " + invoice.getId() + " has no underlying vente");
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 48, 48, 48, 48);
        try {
            PdfWriter.getInstance(doc, out);
            doc.open();

            doc.add(headerBlock(invoice));
            doc.add(spacer(16));
            doc.add(addressesBlock(invoice));
            doc.add(spacer(16));
            doc.add(metaBlock(invoice));
            doc.add(spacer(12));
            doc.add(linesTable(invoice.getVente()));
            doc.add(spacer(8));
            doc.add(totalsBlock(invoice.getTotalAmount()));
            if (invoice.getNotes() != null && !invoice.getNotes().isBlank()) {
                doc.add(spacer(20));
                doc.add(notesBlock(invoice.getNotes()));
            }
            doc.add(spacer(28));
            doc.add(footer());

            doc.close();
        } catch (DocumentException e) {
            throw new IllegalStateException("PDF generation failed for invoice " + invoice.getInvoiceNumber(), e);
        }
        return out.toByteArray();
    }

    // ---------- Blocks ----------

    private PdfPTable headerBlock(Invoice invoice) throws DocumentException {
        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        t.setWidths(new int[]{6, 4});

        PdfPCell left = noBorder();
        Paragraph brand = new Paragraph("StockFlow", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, ACCENT));
        Paragraph title = new Paragraph("FACTURE", TITLE_FONT);
        title.setSpacingBefore(2);
        left.addElement(brand);
        left.addElement(title);
        t.addCell(left);

        PdfPCell right = noBorder();
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Paragraph numLabel = new Paragraph("Numéro de facture", SMALL_MUTED);
        numLabel.setAlignment(Element.ALIGN_RIGHT);
        Paragraph num = new Paragraph(invoice.getInvoiceNumber(), INVOICE_NUMBER_FONT);
        num.setAlignment(Element.ALIGN_RIGHT);
        num.setSpacingBefore(2);
        right.addElement(numLabel);
        right.addElement(num);
        t.addCell(right);

        return t;
    }

    private PdfPTable addressesBlock(Invoice invoice) throws DocumentException {
        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        t.setWidths(new int[]{1, 1});

        // Issuer
        PdfPCell issuer = softCell();
        issuer.addElement(label("ÉMETTEUR"));
        issuer.addElement(line("StockFlow SaaS", BODY_BOLD));
        issuer.addElement(line("support@stockflow.com", BODY_FONT));
        issuer.addElement(line("SIRET — ** à compléter **", LABEL_FONT));
        t.addCell(issuer);

        // Customer
        PdfPCell customer = softCell();
        customer.addElement(label("CLIENT"));
        String name = isBlank(invoice.getCustomerName()) ? "— Non renseigné —" : invoice.getCustomerName();
        customer.addElement(line(name, BODY_BOLD));
        if (!isBlank(invoice.getCustomerEmail())) customer.addElement(line(invoice.getCustomerEmail(), BODY_FONT));
        if (!isBlank(invoice.getCustomerPhone())) customer.addElement(line(invoice.getCustomerPhone(), BODY_FONT));
        if (!isBlank(invoice.getCustomerAddress())) customer.addElement(line(invoice.getCustomerAddress(), BODY_FONT));
        t.addCell(customer);

        return t;
    }

    private PdfPTable metaBlock(Invoice invoice) throws DocumentException {
        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        t.setWidths(new int[]{1, 1});

        PdfPCell left = noBorder();
        left.addElement(label("ÉMISE LE"));
        left.addElement(line(invoice.getIssueDate().format(DATE_FMT), BODY_FONT));
        t.addCell(left);

        PdfPCell right = noBorder();
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);
        right.addElement(rightLabel("ÉMISE PAR"));
        Vente v = invoice.getVente();
        String issuedBy = v != null && v.getUser() != null ? v.getUser().getName() : "—";
        Paragraph p = new Paragraph(issuedBy, BODY_FONT);
        p.setAlignment(Element.ALIGN_RIGHT);
        right.addElement(p);
        t.addCell(right);

        return t;
    }

    private PdfPTable linesTable(Vente vente) throws DocumentException {
        PdfPTable t = new PdfPTable(4);
        t.setWidthPercentage(100);
        t.setWidths(new int[]{6, 2, 3, 3});

        // Header row
        t.addCell(thCell("Produit", Element.ALIGN_LEFT));
        t.addCell(thCell("Qté", Element.ALIGN_RIGHT));
        t.addCell(thCell("P.U.", Element.ALIGN_RIGHT));
        t.addCell(thCell("Sous-total", Element.ALIGN_RIGHT));

        // Lines
        for (LigneVente l : vente.getLignes()) {
            t.addCell(tdCell(l.getProduct().getName(), Element.ALIGN_LEFT));
            t.addCell(tdCell(String.valueOf(l.getQuantite()), Element.ALIGN_RIGHT));
            t.addCell(tdCell(formatCurrency(l.getPrixUnitaire()), Element.ALIGN_RIGHT));
            t.addCell(tdCell(formatCurrency(l.getSousTotal()), Element.ALIGN_RIGHT));
        }
        return t;
    }

    private PdfPTable totalsBlock(BigDecimal total) throws DocumentException {
        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        t.setWidths(new int[]{6, 4});
        t.addCell(noBorder()); // spacer

        PdfPCell right = noBorder();
        right.setBackgroundColor(SOFT_BG);
        right.setBorderColor(BORDER);
        right.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
        right.setBorderWidthTop(2f);
        right.setBorderWidthBottom(1f);
        right.setBorderColorTop(ACCENT);
        right.setPadding(10f);
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);

        PdfPTable inner = new PdfPTable(2);
        inner.setWidthPercentage(100);
        inner.setWidths(new int[]{1, 1});
        inner.addCell(plainCell("Total TTC", LABEL_FONT, Element.ALIGN_LEFT));
        inner.addCell(plainCell(formatCurrency(total), TOTAL_FONT, Element.ALIGN_RIGHT));
        right.addElement(inner);
        t.addCell(right);

        return t;
    }

    private Paragraph notesBlock(String notes) {
        Paragraph p = new Paragraph();
        p.add(new Chunk("Notes : ", BODY_BOLD));
        p.add(new Chunk(notes, BODY_FONT));
        return p;
    }

    private Paragraph footer() {
        Paragraph p = new Paragraph("Merci pour votre confiance. Cette facture a été générée automatiquement par StockFlow.", SMALL_MUTED);
        p.setAlignment(Element.ALIGN_CENTER);
        return p;
    }

    // ---------- Cell / paragraph helpers ----------

    private PdfPCell noBorder() {
        PdfPCell c = new PdfPCell();
        c.setBorder(Rectangle.NO_BORDER);
        return c;
    }

    private PdfPCell softCell() {
        PdfPCell c = new PdfPCell();
        c.setBackgroundColor(SOFT_BG);
        c.setBorderColor(BORDER);
        c.setBorderWidth(0.5f);
        c.setPadding(12f);
        return c;
    }

    private PdfPCell thCell(String text, int align) {
        PdfPCell c = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, MUTED)));
        c.setHorizontalAlignment(align);
        c.setBorder(Rectangle.BOTTOM);
        c.setBorderColor(BORDER);
        c.setBorderWidthBottom(1f);
        c.setBackgroundColor(SOFT_BG);
        c.setPadding(8f);
        return c;
    }

    private PdfPCell tdCell(String text, int align) {
        PdfPCell c = new PdfPCell(new Phrase(text, BODY_FONT));
        c.setHorizontalAlignment(align);
        c.setBorder(Rectangle.BOTTOM);
        c.setBorderColor(BORDER);
        c.setBorderWidthBottom(0.5f);
        c.setPadding(7f);
        return c;
    }

    private PdfPCell plainCell(String text, Font font, int align) {
        PdfPCell c = new PdfPCell(new Phrase(text, font));
        c.setBorder(Rectangle.NO_BORDER);
        c.setHorizontalAlignment(align);
        c.setPadding(2f);
        return c;
    }

    private Paragraph label(String text) {
        Paragraph p = new Paragraph(text, LABEL_FONT);
        p.setSpacingAfter(4);
        return p;
    }

    private Paragraph rightLabel(String text) {
        Paragraph p = new Paragraph(text, LABEL_FONT);
        p.setAlignment(Element.ALIGN_RIGHT);
        p.setSpacingAfter(4);
        return p;
    }

    private Paragraph line(String text, Font font) {
        Paragraph p = new Paragraph(text, font);
        p.setSpacingAfter(2);
        return p;
    }

    private Paragraph spacer(float pts) {
        Paragraph p = new Paragraph(" ");
        p.setSpacingBefore(pts);
        return p;
    }

    private static String formatCurrency(BigDecimal value) {
        if (value == null) return "0,00 €";
        return String.format(Locale.FRENCH, "%,.2f €", value);
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    /** Wraps a paragraph chunk as a try-friendly addElement source. */
    @SuppressWarnings("unused")
    private static IOException notReached(IOException e) {
        return e;
    }
}
