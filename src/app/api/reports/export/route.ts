import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import { 
  format as dateFormat, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  subMonths
} from 'date-fns';
import { withAuth } from '@/lib/auth';
import PDFDocument from 'pdfkit';

// GET - Export task performance reports
export async function GET(request: NextRequest) {
  return withAuth(request, async (authUser) => {
    try {
      await connectToDatabase();
      
      // Get current user
      const user = await User.findById(authUser.userId);
      if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      
      // Only SUPER_ADMIN and MANAGER can access reports
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
        return NextResponse.json({ success: false, message: 'Unauthorized access to reports' }, { status: 403 });
      }
      
      // Get query parameters
      const searchParams = request.nextUrl.searchParams;
      const format = searchParams.get('format') || 'csv';
      const startDate = searchParams.get('startDate') || subMonths(new Date(), 1).toISOString();
      const endDate = searchParams.get('endDate') || new Date().toISOString();
      const fields = searchParams.get('fields')?.split(',') || ['all'];
      const filename = searchParams.get('filename') || `report-${Date.now()}.${format}`;
      const paperSize = searchParams.get('paperSize') || 'A4';
      const orientation = searchParams.get('orientation') || 'portrait';
      
      // Get all users except SUPER_ADMIN
      const users = await User.find({ role: { $ne: 'SUPER_ADMIN' } });
      
      // Get all tasks within date range
      const tasks = await Task.find({
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }).populate('assignedTo');
      
      // Calculate report data
      const reports = users.map(u => {
        const userTasks = tasks.filter(task => 
          task.assignedTo && task.assignedTo._id.toString() === u._id.toString()
        );
        
        const totalTasks = userTasks.length;
        const completedTasks = userTasks.filter(task => task.status === 'COMPLETED').length;
        const pendingTasks = totalTasks - completedTasks;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        return {
          employeeId: u._id.toString(),
          employeeName: `${u.firstName} ${u.lastName}`,
          employeeRole: u.role,
          totalTasks,
          completedTasks,
          pendingTasks,
          completionRate
        };
      });
      
      // Sort by completion rate descending
      reports.sort((a, b) => b.completionRate - a.completionRate);
      
      // Calculate summary data
      const totalUsers = users.length;
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
      const averageCompletionRate = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100) 
        : 0;
      
      // Create report data object
      const reportData = {
        period: `${dateFormat(new Date(startDate), 'MMM d, yyyy')} - ${dateFormat(new Date(endDate), 'MMM d, yyyy')}`,
        summary: {
          totalUsers,
          totalTasks,
          completedTasks,
          averageCompletionRate
        },
        reports
      };
      
      // Create a report based on the selected format
      if (format === 'pdf') {
        // Create a new PDF document
        const doc = new PDFDocument({
          margin: 50,
          size: paperSize,
          layout: orientation as 'portrait' | 'landscape'
        });
        
        // Create a stream to collect PDF data
        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        
        // Document title
        doc.fontSize(24).font('Helvetica-Bold').text('Task Performance Report', { align: 'center' });
        doc.moveDown();
        
        // Report period and generation info
        doc.fontSize(12).font('Helvetica-Oblique')
          .text(`Period: ${reportData.period}`, { align: 'center' })
          .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);
        
        // Summary Section
        doc.fontSize(16).font('Helvetica-Bold').text('Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica')
          .text(`Total Users: ${reportData.summary.totalUsers}`)
          .text(`Total Tasks: ${reportData.summary.totalTasks}`)
          .text(`Completed Tasks: ${reportData.summary.completedTasks}`)
          .text(`Average Completion Rate: ${reportData.summary.averageCompletionRate}%`);
        doc.moveDown(2);
        
        // Employee Performance
        doc.fontSize(16).font('Helvetica-Bold').text('Employee Performance', { underline: true });
        doc.moveDown(1);
        
        // Table headers
        const tableTop = doc.y;
        let tableWidth = 500;
        const colWidths = {
          name: 120,
          role: 80,
          completion: 70,
          total: 50,
          completed: 60,
          pending: 60
        };
        
        // Function to draw table cell with borders
        const drawTableCell = (text: string, x: number, y: number, width: number, align: string = 'left') => {
          doc.rect(x, y, width, 25).stroke(); // Draw cell border
          doc.text(text, x + 5, y + 7, { width: width - 10, align: align as any });
        };
        
        // Draw table headers
        let currentX = 50;
        drawTableCell('Employee', currentX, tableTop, colWidths.name);
        currentX += colWidths.name;
        
        drawTableCell('Role', currentX, tableTop, colWidths.role);
        currentX += colWidths.role;
        
        drawTableCell('Completion %', currentX, tableTop, colWidths.completion, 'center');
        currentX += colWidths.completion;
        
        drawTableCell('Total', currentX, tableTop, colWidths.total, 'center');
        currentX += colWidths.total;
        
        drawTableCell('Completed', currentX, tableTop, colWidths.completed, 'center');
        currentX += colWidths.completed;
        
        drawTableCell('Pending', currentX, tableTop, colWidths.pending, 'center');
        
        // Table rows
        let currentY = tableTop + 25; // Start after header row
        
        // Draw employee rows
        for (const report of reportData.reports) {
          // Check if we need a new page
          if (currentY > doc.page.height - 100) {
            doc.addPage();
            currentY = 50; // Reset Y position on new page
          }
          
          currentX = 50;
          drawTableCell(report.employeeName, currentX, currentY, colWidths.name);
          currentX += colWidths.name;
          
          drawTableCell(report.employeeRole, currentX, currentY, colWidths.role);
          currentX += colWidths.role;
          
          drawTableCell(`${report.completionRate}%`, currentX, currentY, colWidths.completion, 'center');
          currentX += colWidths.completion;
          
          drawTableCell(report.totalTasks.toString(), currentX, currentY, colWidths.total, 'center');
          currentX += colWidths.total;
          
          drawTableCell(report.completedTasks.toString(), currentX, currentY, colWidths.completed, 'center');
          currentX += colWidths.completed;
          
          drawTableCell(report.pendingTasks.toString(), currentX, currentY, colWidths.pending, 'center');
          
          currentY += 25; // Move to next row
        }
        
        // Add footer
        doc.moveDown(4);
        doc.fontSize(10).font('Helvetica')
          .text(`© ${new Date().getFullYear()} Task Management System. Generated on ${new Date().toLocaleString()}`, 
                { align: 'center' });
        
        // Finalize the PDF
        doc.end();
        
        // Wait for PDF to be fully generated
        return new Promise<NextResponse>((resolve) => {
          doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            
            // Set response headers for PDF download
            const headers = new Headers();
            headers.set('Content-Type', 'application/pdf');
            headers.set('Content-Disposition', `attachment; filename="${filename}"`);
            
            resolve(new NextResponse(pdfBuffer, {
              status: 200,
              headers: headers,
            }));
          });
        });
      } else if (format === 'html') {
        // Generate an HTML page that can be printed to PDF by the browser
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Task Performance Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              line-height: 1.6;
            }
            h1, h2 {
              text-align: center;
              color: #333;
            }
            .report-date {
              text-align: center;
              margin-bottom: 30px;
              font-style: italic;
              color: #666;
            }
            .summary {
              margin: 20px 0;
              padding: 15px;
              background: #f9f9f9;
              border-radius: 4px;
            }
            .employee {
              margin-bottom: 20px;
              padding: 15px;
              border-bottom: 1px solid #eee;
            }
            .metric {
              margin-left: 20px;
            }
            .completion-rate {
              font-weight: bold;
              color: #28a745;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            @media print {
              body {
                margin: 20px;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()">Print as PDF</button>
          </div>
          
          <h1>Task Performance Report</h1>
          <div class="report-date">
            Period: ${reportData.period}<br>
            Generated on: ${new Date().toLocaleString()}
          </div>
          
          <div class="summary">
            <h2>Summary</h2>
            <p>Total Users: ${reportData.summary.totalUsers}</p>
            <p>Total Tasks: ${reportData.summary.totalTasks}</p>
            <p>Completed Tasks: ${reportData.summary.completedTasks}</p>
            <p>Average Completion Rate: ${reportData.summary.averageCompletionRate}%</p>
          </div>
          
          <h2>Employee Performance</h2>
          
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Completion Rate</th>
                <th>Total Tasks</th>
                <th>Completed</th>
                <th>Pending</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.reports.map(report => `
                <tr>
                  <td>${report.employeeName}</td>
                  <td>${report.employeeRole}</td>
                  <td class="completion-rate">${report.completionRate}%</td>
                  <td>${report.totalTasks}</td>
                  <td>${report.completedTasks}</td>
                  <td>${report.pendingTasks}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            © ${new Date().getFullYear()} Task Management System. Generated on ${new Date().toLocaleString()}
          </div>
        </body>
        </html>
        `;
        
        // Return HTML content
        const headers = new Headers();
        headers.set('Content-Type', 'text/html');
        
        return new NextResponse(html, {
          status: 200,
          headers: headers,
        });
      } else if (format === 'csv') {
        // Generate CSV
        let csvContent = 'Employee,Role,Total Tasks,Completed,Pending,Completion Rate\n';
        
        for (const report of reportData.reports) {
          // Add a row for each employee
          csvContent += `"${report.employeeName}","${report.employeeRole}",${report.totalTasks},${report.completedTasks},${report.pendingTasks},${report.completionRate}%\n`;
        }
        
        // Set headers for CSV download
        const headers = new Headers();
        headers.set('Content-Type', 'text/csv');
        headers.set('Content-Disposition', `attachment; filename=${filename}`);
        
        return new NextResponse(csvContent, {
          status: 200,
          headers: headers,
        });
      } else if (format === 'text') {
        // Generate a plain text report
        let textContent = 'TASK PERFORMANCE REPORT\n';
        textContent += `=======================\n\n`;
        textContent += `Period: ${reportData.period}\n`;
        textContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
        
        textContent += `SUMMARY\n`;
        textContent += `-------\n`;
        textContent += `Total Users: ${reportData.summary.totalUsers}\n`;
        textContent += `Total Tasks: ${reportData.summary.totalTasks}\n`;
        textContent += `Completed Tasks: ${reportData.summary.completedTasks}\n`;
        textContent += `Average Completion Rate: ${reportData.summary.averageCompletionRate}%\n\n`;
        
        textContent += `EMPLOYEE PERFORMANCE\n`;
        textContent += `-------------------\n\n`;
        
        for (const report of reportData.reports) {
          textContent += `Employee: ${report.employeeName} (${report.employeeRole})\n`;
          textContent += `Completion Rate: ${report.completionRate}%\n`;
          
          if (fields.includes('taskCounts') || fields.includes('all')) {
            textContent += `Total Tasks: ${report.totalTasks}  |  Completed: ${report.completedTasks}  |  Pending: ${report.pendingTasks}\n`;
          }
          
          textContent += `\n------------------------\n\n`;
        }
        
        // Set headers for text download
        const headers = new Headers();
        headers.set('Content-Type', 'text/plain');
        headers.set('Content-Disposition', `attachment; filename=${filename}`);
        
        return new NextResponse(textContent, {
          status: 200,
          headers: headers,
        });
      } else {
        // Fallback to JSON (default)
        return NextResponse.json(reportData, { status: 200 });
      }
    } catch (error) {
      console.error('Error generating export report:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to generate export report', error: (error as any).message },
        { status: 500 }
      );
    }
  });
}

// POST - Generate report from provided data
export async function POST(request: NextRequest) {
  return withAuth(request, async (authUser) => {
    try {
      await connectToDatabase();
      
      // Get current user and validate permissions
      const user = await User.findById(authUser.userId);
      if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      
      // Only SUPER_ADMIN and MANAGER can access reports
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
        return NextResponse.json({ success: false, message: 'Unauthorized. Only managers and admins can export reports' }, { status: 403 });
      }
      
      // Parse the request body
      const { data, options } = await request.json();
      
      if (!data || !options) {
        return NextResponse.json(
          { success: false, message: 'Missing required data for export' },
          { status: 400 }
        );
      }
      
      // Get export options
      const format = options.format || 'csv';
      const fields = options.fields || ['all'];
      const filename = options.filename || `report-${Date.now()}.${format}`;
      
      // Create a report based on the selected format
      if (format === 'pdf') {
        // Create a new PDF document
        const doc = new PDFDocument({
          margin: 50,
          size: options.paperSize || 'A4',
          layout: options.orientation || 'portrait' as 'portrait' | 'landscape'
        });
        
        // Create a stream to collect PDF data
        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        
        // Document title
        doc.fontSize(24).font('Helvetica-Bold').text('Task Performance Report', { align: 'center' });
        doc.moveDown();
        
        // Report period and generation info
        doc.fontSize(12).font('Helvetica-Oblique')
          .text(`Period: ${data.period}`, { align: 'center' })
          .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);
        
        // Summary Section
        doc.fontSize(16).font('Helvetica-Bold').text('Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica')
          .text(`Total Users: ${data.summary.totalUsers}`)
          .text(`Total Tasks: ${data.summary.totalTasks}`)
          .text(`Completed Tasks: ${data.summary.completedTasks}`)
          .text(`Average Completion Rate: ${data.summary.averageCompletionRate}%`);
        doc.moveDown(2);
        
        // Employee Performance
        doc.fontSize(16).font('Helvetica-Bold').text('Employee Performance', { underline: true });
        doc.moveDown(1);
        
        // Table headers
        const tableTop = doc.y;
        let tableWidth = 500;
        const colWidths = {
          name: 120,
          role: 80,
          completion: 70,
          total: 50,
          completed: 60,
          pending: 60,
          onTime: 60,
          late: 60
        };
        
        // Function to draw table cell with borders
        const drawTableCell = (text: string, x: number, y: number, width: number, align: string = 'left') => {
          doc.rect(x, y, width, 25).stroke(); // Draw cell border
          doc.text(text, x + 5, y + 7, { width: width - 10, align: align as any });
        };
        
        // Draw table headers
        let currentX = 50;
        drawTableCell('Employee', currentX, tableTop, colWidths.name);
        currentX += colWidths.name;
        
        drawTableCell('Role', currentX, tableTop, colWidths.role);
        currentX += colWidths.role;
        
        drawTableCell('Completion %', currentX, tableTop, colWidths.completion, 'center');
        currentX += colWidths.completion;
        
        drawTableCell('Total', currentX, tableTop, colWidths.total, 'center');
        currentX += colWidths.total;
        
        drawTableCell('Completed', currentX, tableTop, colWidths.completed, 'center');
        currentX += colWidths.completed;
        
        drawTableCell('Pending', currentX, tableTop, colWidths.pending, 'center');
        
        // Table rows
        let currentY = tableTop + 25; // Start after header row
        
        // Draw employee rows
        for (const report of data.reports) {
          // Check if we need a new page
          if (currentY > doc.page.height - 100) {
            doc.addPage();
            currentY = 50; // Reset Y position on new page
          }
          
          currentX = 50;
          drawTableCell(report.employeeName, currentX, currentY, colWidths.name);
          currentX += colWidths.name;
          
          drawTableCell(report.employeeRole, currentX, currentY, colWidths.role);
          currentX += colWidths.role;
          
          drawTableCell(`${report.completionRate}%`, currentX, currentY, colWidths.completion, 'center');
          currentX += colWidths.completion;
          
          drawTableCell(report.totalTasks.toString(), currentX, currentY, colWidths.total, 'center');
          currentX += colWidths.total;
          
          drawTableCell(report.completedTasks.toString(), currentX, currentY, colWidths.completed, 'center');
          currentX += colWidths.completed;
          
          drawTableCell(report.pendingTasks.toString(), currentX, currentY, colWidths.pending, 'center');
          
          currentY += 25; // Move to next row
        }
        
        // Add footer
        doc.moveDown(4);
        doc.fontSize(10).font('Helvetica')
          .text(`© ${new Date().getFullYear()} Task Management System. Generated on ${new Date().toLocaleString()}`, 
                { align: 'center' });
        
        // Finalize the PDF
        doc.end();
        
        // Wait for PDF to be fully generated
        return new Promise<NextResponse>((resolve) => {
          doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            
            // Set response headers for PDF download
            const headers = new Headers();
            headers.set('Content-Type', 'application/pdf');
            headers.set('Content-Disposition', `attachment; filename="${filename}"`);
            
            resolve(new NextResponse(pdfBuffer, {
              status: 200,
              headers: headers,
            }));
          });
        });
      } else if (format === 'html') {
        // Generate an HTML page that can be printed to PDF by the browser
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Task Performance Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              line-height: 1.6;
            }
            h1, h2 {
              text-align: center;
              color: #333;
            }
            .report-date {
              text-align: center;
              margin-bottom: 30px;
              font-style: italic;
              color: #666;
            }
            .summary {
              margin: 20px 0;
              padding: 15px;
              background: #f9f9f9;
              border-radius: 4px;
            }
            .employee {
              margin-bottom: 20px;
              padding: 15px;
              border-bottom: 1px solid #eee;
            }
            .metric {
              margin-left: 20px;
            }
            .completion-rate {
              font-weight: bold;
              color: #28a745;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            @media print {
              body {
                margin: 20px;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()">Print as PDF</button>
          </div>
          
          <h1>Task Performance Report</h1>
          <div class="report-date">
            Period: ${data.period}<br>
            Generated on: ${new Date().toLocaleString()}
          </div>
          
          <div class="summary">
            <h2>Summary</h2>
            <p>Total Users: ${data.summary.totalUsers}</p>
            <p>Total Tasks: ${data.summary.totalTasks}</p>
            <p>Completed Tasks: ${data.summary.completedTasks}</p>
            <p>Average Completion Rate: ${data.summary.averageCompletionRate}%</p>
          </div>
          
          <h2>Employee Performance</h2>
          
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Completion Rate</th>
                <th>Total Tasks</th>
                <th>Completed</th>
                <th>Pending</th>
                ${fields.includes('completionRates') || fields.includes('all') ? '<th>On Time</th><th>Late</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${data.reports.map(report => `
                <tr>
                  <td>${report.employeeName}</td>
                  <td>${report.employeeRole}</td>
                  <td class="completion-rate">${report.completionRate}%</td>
                  <td>${report.totalTasks}</td>
                  <td>${report.completedTasks}</td>
                  <td>${report.pendingTasks}</td>
                  ${fields.includes('completionRates') || fields.includes('all') ? 
                    `<td>${report.onTimeCompletions}</td><td>${report.lateCompletions}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            © ${new Date().getFullYear()} Task Management System. Generated on ${new Date().toLocaleString()}
          </div>
        </body>
        </html>
        `;
        
        // Return HTML content
        const headers = new Headers();
        headers.set('Content-Type', 'text/html');
        
        return new NextResponse(html, {
          status: 200,
          headers: headers,
        });
      } else if (format === 'csv') {
        // Generate CSV
        let csvContent = 'Employee,Role,Total Tasks,Completed,Pending,Completion Rate,On-Time,Late\n';
        
        for (const report of data.reports) {
          // Add a row for each employee
          csvContent += `"${report.employeeName}","${report.employeeRole}",${report.totalTasks},${report.completedTasks},${report.pendingTasks},${report.completionRate}%,${report.onTimeCompletions},${report.lateCompletions}\n`;
        }
        
        // Set headers for CSV download
        const headers = new Headers();
        headers.set('Content-Type', 'text/csv');
        headers.set('Content-Disposition', `attachment; filename=${filename}`);
        
        return new NextResponse(csvContent, {
          status: 200,
          headers: headers,
        });
      } else if (format === 'text') {
        // Generate a plain text report
        let textContent = 'TASK PERFORMANCE REPORT\n';
        textContent += `=======================\n\n`;
        textContent += `Period: ${data.period}\n`;
        textContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
        
        textContent += `SUMMARY\n`;
        textContent += `-------\n`;
        textContent += `Total Users: ${data.summary.totalUsers}\n`;
        textContent += `Total Tasks: ${data.summary.totalTasks}\n`;
        textContent += `Completed Tasks: ${data.summary.completedTasks}\n`;
        textContent += `Average Completion Rate: ${data.summary.averageCompletionRate}%\n\n`;
        
        textContent += `EMPLOYEE PERFORMANCE\n`;
        textContent += `-------------------\n\n`;
        
        for (const report of data.reports) {
          textContent += `Employee: ${report.employeeName} (${report.employeeRole})\n`;
          textContent += `Completion Rate: ${report.completionRate}%\n`;
          
          if (fields.includes('taskCounts') || fields.includes('all')) {
            textContent += `Total Tasks: ${report.totalTasks}  |  Completed: ${report.completedTasks}  |  Pending: ${report.pendingTasks}\n`;
          }
          
          if (fields.includes('completionRates') || fields.includes('all')) {
            textContent += `On-Time Completions: ${report.onTimeCompletions}  |  Late Completions: ${report.lateCompletions}\n`;
          }
          
          textContent += `\n------------------------\n\n`;
        }
        
        // Set headers for text download
        const headers = new Headers();
        headers.set('Content-Type', 'text/plain');
        headers.set('Content-Disposition', `attachment; filename=${filename}`);
        
        return new NextResponse(textContent, {
          status: 200,
          headers: headers,
        });
      } else {
        // Fallback to JSON (default)
        return NextResponse.json(data, { status: 200 });
      }
    } catch (error) {
      console.error('Error generating export report:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to generate export report', error: (error as any).message },
        { status: 500 }
      );
    }
  });
} 