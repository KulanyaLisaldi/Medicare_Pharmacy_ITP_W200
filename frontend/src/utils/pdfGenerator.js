import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

class PDFReportGenerator {
    constructor() {
        this.doc = new jsPDF();
        this.pageWidth = this.doc.internal.pageSize.getWidth();
        this.pageHeight = this.doc.internal.pageSize.getHeight();
        this.margin = 20;
        this.currentY = 0;
        this.primaryColor = '#3b82f6';
        this.secondaryColor = '#6b7280';
    }

    // Add pharmacy header with logo
    addHeader(pharmacyName = 'Medicare Pharmacy', reportTitle = 'Pharmacy Report', reportDate = null) {
        // Pharmacy Logo (placeholder - you can replace with actual logo)
        this.doc.setFillColor(this.primaryColor);
        this.doc.rect(this.margin, this.margin, 30, 20, 'F');
        
        // Logo text
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('MP', this.margin + 15, this.margin + 12, { align: 'center' });

        // Pharmacy name
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFontSize(18);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(pharmacyName, this.margin + 40, this.margin + 8);

        // Report title
        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(reportTitle, this.margin + 40, this.margin + 16);

        // Report date
        const date = reportDate || new Date().toLocaleDateString();
        this.doc.setFontSize(10);
        this.doc.setTextColor(this.secondaryColor);
        this.doc.text(`Generated on: ${date}`, this.margin + 40, this.margin + 22);

        // Line separator
        this.doc.setDrawColor(this.primaryColor);
        this.doc.setLineWidth(0.5);
        this.doc.line(this.margin, this.margin + 30, this.pageWidth - this.margin, this.margin + 30);

        this.currentY = this.margin + 40;
    }

    // Add section header
    addSectionHeader(title, color = this.primaryColor) {
        this.currentY += 10;
        
        this.doc.setFillColor(color);
        this.doc.rect(this.margin, this.currentY - 2, 4, 12, 'F');
        
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(title, this.margin + 8, this.currentY + 4);
        
        this.currentY += 15;
    }

    // Add summary cards as a table
    addSummaryCards(summary) {
        const summaryData = [
            ['Metric', 'Value', 'Details'],
            ['Total Products', summary.totalProducts || 0, 'Active products in inventory'],
            ['Low Stock Items', summary.lowStockCount || 0, 'Products with stock ≤ 10'],
            ['Out of Stock', summary.outOfStockCount || 0, 'Products with 0 stock'],
            ['Expired Products', summary.expiredCount || 0, 'Products past expiry date'],
            ['Near Expiry', summary.nearExpiryCount || 0, 'Products expiring within 30 days'],
            ['Total Orders', summary.totalOrders || 0, 'All time orders'],
            ['Fulfillment Rate', `${summary.fulfillmentRate || 0}%`, 'Successfully fulfilled orders'],
            ['Total Revenue', `Rs.${(summary.totalRevenue || 0).toLocaleString()}`, 'All time revenue'],
            ['Average Order Value', `Rs.${(summary.averageOrderValue || 0).toFixed(2)}`, 'Per order average']
        ];

        autoTable(this.doc, {
            startY: this.currentY,
            head: [summaryData[0]],
            body: summaryData.slice(1),
            theme: 'grid',
            headStyles: {
                fillColor: this.primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            margin: { left: this.margin, right: this.margin },
            styles: {
                fontSize: 9,
                cellPadding: 3
            }
        });

        this.currentY = this.doc.lastAutoTable.finalY + 10;
    }

    // Add stock analysis table
    addStockAnalysis(stockData) {
        if (!stockData || stockData.length === 0) {
            this.doc.setFontSize(10);
            this.doc.setTextColor(this.secondaryColor);
            this.doc.text('No stock issues found', this.margin, this.currentY);
            this.currentY += 15;
            return;
        }

        const stockTableData = stockData.map(item => [
            item.name,
            item.stock || 0,
            item.category || 'N/A',
            `Rs.${(item.price || 0).toFixed(2)}`
        ]);

        autoTable(this.doc, {
            startY: this.currentY,
            head: [['Product Name', 'Stock', 'Category', 'Price']],
            body: stockTableData,
            theme: 'grid',
            headStyles: {
                fillColor: '#ef4444',
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            margin: { left: this.margin, right: this.margin },
            styles: {
                fontSize: 8,
                cellPadding: 2
            }
        });

        this.currentY = this.doc.lastAutoTable.finalY + 10;
    }

    // Add expired products table
    addExpiredProducts(expiredData) {
        if (!expiredData || expiredData.length === 0) {
            this.doc.setFontSize(10);
            this.doc.setTextColor(this.secondaryColor);
            this.doc.text('No expired products found', this.margin, this.currentY);
            this.currentY += 15;
            return;
        }

        const expiredTableData = expiredData.map(item => [
            item.name,
            new Date(item.expiryDate).toLocaleDateString(),
            item.stock || 0,
            item.category || 'N/A'
        ]);

        autoTable(this.doc, {
            startY: this.currentY,
            head: [['Product Name', 'Expiry Date', 'Stock', 'Category']],
            body: expiredTableData,
            theme: 'grid',
            headStyles: {
                fillColor: '#f97316',
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            margin: { left: this.margin, right: this.margin },
            styles: {
                fontSize: 8,
                cellPadding: 2
            }
        });

        this.currentY = this.doc.lastAutoTable.finalY + 10;
    }

    // Add order statistics
    addOrderStatistics(orderStats) {
        const orderData = [
            ['Order Status', 'Count', 'Percentage'],
            ['Fulfilled', orderStats.fulfilled || 0, `${orderStats.total > 0 ? Math.round((orderStats.fulfilled / orderStats.total) * 100) : 0}%`],
            ['Pending', orderStats.pending || 0, `${orderStats.total > 0 ? Math.round((orderStats.pending / orderStats.total) * 100) : 0}%`],
            ['Canceled', orderStats.canceled || 0, `${orderStats.total > 0 ? Math.round((orderStats.canceled / orderStats.total) * 100) : 0}%`],
            ['Total', orderStats.total || 0, '100%']
        ];

        autoTable(this.doc, {
            startY: this.currentY,
            head: [orderData[0]],
            body: orderData.slice(1),
            theme: 'grid',
            headStyles: {
                fillColor: this.primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            margin: { left: this.margin, right: this.margin },
            styles: {
                fontSize: 9,
                cellPadding: 3
            }
        });

        this.currentY = this.doc.lastAutoTable.finalY + 10;
    }

    // Add top selling products
    addTopSellingProducts(topProducts) {
        if (!topProducts || topProducts.length === 0) {
            this.doc.setFontSize(10);
            this.doc.setTextColor(this.secondaryColor);
            this.doc.text('No sales data available', this.margin, this.currentY);
            this.currentY += 15;
            return;
        }

        const topProductsData = topProducts.map((product, index) => [
            index + 1,
            product.name,
            product.quantity
        ]);

        autoTable(this.doc, {
            startY: this.currentY,
            head: [['Rank', 'Product Name', 'Quantity Sold']],
            body: topProductsData,
            theme: 'grid',
            headStyles: {
                fillColor: '#10b981',
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            margin: { left: this.margin, right: this.margin },
            styles: {
                fontSize: 8,
                cellPadding: 2
            }
        });

        this.currentY = this.doc.lastAutoTable.finalY + 10;
    }

    // Add category analysis
    addCategoryAnalysis(categoryData) {
        if (!categoryData || categoryData.length === 0) {
            this.doc.setFontSize(10);
            this.doc.setTextColor(this.secondaryColor);
            this.doc.text('No category data available', this.margin, this.currentY);
            this.currentY += 15;
            return;
        }

        const categoryTableData = categoryData.map(category => [
            category.category,
            category.total || 0,
            category.healthy || 0,
            category.low || 0,
            category.out || 0,
            category.expired || 0
        ]);

        autoTable(this.doc, {
            startY: this.currentY,
            head: [['Category', 'Total', 'Healthy', 'Low Stock', 'Out of Stock', 'Expired']],
            body: categoryTableData,
            theme: 'grid',
            headStyles: {
                fillColor: '#8b5cf6',
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            margin: { left: this.margin, right: this.margin },
            styles: {
                fontSize: 8,
                cellPadding: 2
            }
        });

        this.currentY = this.doc.lastAutoTable.finalY + 10;
    }

    // Add footer
    addFooter() {
        const footerY = this.pageHeight - 20;
        
        // Footer line
        this.doc.setDrawColor(this.primaryColor);
        this.doc.setLineWidth(0.5);
        this.doc.line(this.margin, footerY - 10, this.pageWidth - this.margin, footerY - 10);

        // Footer text
        this.doc.setFontSize(8);
        this.doc.setTextColor(this.secondaryColor);
        this.doc.text('Medicare Pharmacy Management System', this.margin, footerY - 5);
        this.doc.text(`Page ${this.doc.internal.getNumberOfPages()}`, this.pageWidth - this.margin - 20, footerY - 5, { align: 'right' });
    }

    // Generate complete report
    generateReport(reportData, filters = {}) {
        const reportTitle = this.getReportTitle(filters);
        const reportDate = new Date().toLocaleDateString();
        
        // Add header
        this.addHeader('Medicare Pharmacy', reportTitle, reportDate);
        
        // Add filter information if any
        if (filters.reportType && filters.reportType !== 'all') {
            this.addSectionHeader('Report Filters', '#6b7280');
            this.doc.setFontSize(10);
            this.doc.setTextColor(this.secondaryColor);
            this.doc.text(`Report Type: ${filters.reportType.charAt(0).toUpperCase() + filters.reportType.slice(1)}`, this.margin, this.currentY);
            this.currentY += 8;
            if (filters.startDate && filters.endDate) {
                this.doc.text(`Date Range: ${filters.startDate} to ${filters.endDate}`, this.margin, this.currentY);
                this.currentY += 8;
            }
            this.currentY += 10;
        }

        // Add summary
        if (reportData.summary) {
            this.addSectionHeader('Summary', this.primaryColor);
            this.addSummaryCards(reportData.summary);
        }

        // Add stock analysis if available
        if (reportData.stockAnalysis && (filters.reportType === 'all' || filters.reportType === 'stock')) {
            if (reportData.stockAnalysis.lowStockProducts && reportData.stockAnalysis.lowStockProducts.length > 0) {
                this.addSectionHeader('Low Stock Products', '#ef4444');
                this.addStockAnalysis(reportData.stockAnalysis.lowStockProducts);
            }

            if (reportData.stockAnalysis.expiredProducts && reportData.stockAnalysis.expiredProducts.length > 0) {
                this.addSectionHeader('Expired Products', '#f97316');
                this.addExpiredProducts(reportData.stockAnalysis.expiredProducts);
            }

            if (reportData.stockAnalysis.nearExpiryProducts && reportData.stockAnalysis.nearExpiryProducts.length > 0) {
                this.addSectionHeader('Near Expiry Products', '#f59e0b');
                this.addExpiredProducts(reportData.stockAnalysis.nearExpiryProducts);
            }
        }

        // Add order analysis if available
        if (reportData.orderAnalysis && (filters.reportType === 'all' || filters.reportType === 'orders' || filters.reportType === 'revenue')) {
            if (reportData.orderAnalysis.orderStats) {
                this.addSectionHeader('Order Statistics', this.primaryColor);
                this.addOrderStatistics(reportData.orderAnalysis.orderStats);
            }

            if (reportData.orderAnalysis.topSellingProducts && reportData.orderAnalysis.topSellingProducts.length > 0) {
                this.addSectionHeader('Top Selling Products', '#10b981');
                this.addTopSellingProducts(reportData.orderAnalysis.topSellingProducts);
            }
        }

        // Add category analysis if available
        if (reportData.categoryAnalysis && (filters.reportType === 'all' || filters.reportType === 'stock')) {
            this.addSectionHeader('Category Analysis', '#8b5cf6');
            this.addCategoryAnalysis(reportData.categoryAnalysis);
        }

        // Add footer
        this.addFooter();

        return this.doc;
    }

    // Get report title based on filters
    getReportTitle(filters) {
        let title = 'Pharmacy Report';
        
        if (filters.reportType) {
            switch (filters.reportType) {
                case 'stock':
                    title = 'Stock Analysis Report';
                    break;
                case 'orders':
                    title = 'Order Analytics Report';
                    break;
                case 'revenue':
                    title = 'Revenue Report';
                    break;
                default:
                    title = 'Comprehensive Pharmacy Report';
            }
        }

        if (filters.startDate && filters.endDate) {
            title += ` (${filters.startDate} to ${filters.endDate})`;
        }

        return title;
    }

    // Download PDF
    downloadPDF(filename = 'pharmacy-report.pdf') {
        this.doc.save(filename);
    }
}

export default PDFReportGenerator;
