import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateOrderPDF = (order) => {
    const doc = new jsPDF();

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount, currency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    };

    const formatAddress = (address) => {
        if (!address) return 'N/A';
        const parts = [
            `${address.first_name || ''} ${address.last_name || ''}`.trim(),
            address.company,
            address.address_1,
            address.address_2,
            `${address.city || ''}, ${address.state || ''} ${address.postcode || ''}`.trim(),
            address.country,
            address.email,
            address.phone
        ].filter(Boolean).filter(p => p.trim() !== ',');
        return parts.join('\n');
    };

    doc.setFontSize(22);
    doc.text(`Invoice for Order #${order.id}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`From: ${order.store_name}`, 14, 30);
    doc.text(`Date: ${formatDate(order.date_created)}`, 14, 36);

    doc.autoTable({
        startY: 45,
        head: [['Billing Information', 'Shipping Information']],
        body: [
            [formatAddress(order.billing), formatAddress(order.shipping)]
        ],
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
    });

    const items = order.line_items.map(item => [
        item.name,
        item.quantity,
        formatCurrency(item.price, order.currency),
        formatCurrency(item.total, order.currency)
    ]);

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Product', 'Quantity', 'Price', 'Total']],
        body: items,
        theme: 'striped',
        headStyles: {
            fillColor: [41, 128, 185]
        },
        styles: {
            fontSize: 9
        },
    });

    const totalsData = [
        ['Subtotal', formatCurrency(order.total - order.total_tax, order.currency)],
        ['Tax', formatCurrency(order.total_tax, order.currency)],
        ['Shipping', formatCurrency(order.shipping_total, order.currency)],
    ];
    if (order.discount_total > 0) {
        totalsData.push(['Discount', `-${formatCurrency(order.discount_total, order.currency)}`]);
    }
     totalsData.push(['Total', formatCurrency(order.total, order.currency)]);

    doc.autoTable({
        startY: doc.lastAutoTable.finalY,
        body: totalsData,
        theme: 'plain',
        styles: {
            halign: 'right',
            fontSize: 10
        },
        columnStyles: {
             0: { fontStyle: 'bold' }
        },
        tableWidth: 'wrap',
        margin: { left: doc.internal.pageSize.getWidth() - 80 },
    });
    
    if (order.customer_note) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Customer Note:', 14, doc.lastAutoTable.finalY + 15);
        doc.setFont('helvetica', 'normal');
        const splitNote = doc.splitTextToSize(order.customer_note, 180);
        doc.text(splitNote, 14, doc.lastAutoTable.finalY + 20);
    }
    
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Thank you for your business!`, 14, doc.internal.pageSize.getHeight() - 10);


    doc.save(`Order-${order.id}-Invoice.pdf`);
};