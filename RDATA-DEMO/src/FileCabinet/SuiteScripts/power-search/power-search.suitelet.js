/**
* @NApiVersion 2.1
* @NScriptType Suitelet
* @NModuleScope Public
*/

/* 

------------------------------------------------------------------------------------------
Script Information
------------------------------------------------------------------------------------------

Name:
Power Search

ID:
_power_search

Description
A utility that can be used to perform keyword searches across multiple record types.
It is designed to serve as an alternative to the native Global Search feature.


------------------------------------------------------------------------------------------
MIT License
------------------------------------------------------------------------------------------

Copyright (c) 2023 Timothy Dietrich.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


------------------------------------------------------------------------------------------
Developer(s)
------------------------------------------------------------------------------------------

Tim Dietrich
* timdietrich@me.com
* https://timdietrich.me


------------------------------------------------------------------------------------------
History
------------------------------------------------------------------------------------------

20230701 - Tim Dietrich
• Initial public release (v2023.1).

*/


var 
	log,
	query,
	serverWidget,
	keywords = '',
	version = '2023.1';


define( [ 'N/log', 'N/query', 'N/ui/serverWidget' ], main );


function main( logModule, queryModule, serverWidgetModule ) {

	log = logModule;
	query= queryModule;
	serverWidget = serverWidgetModule;				
	
    return {
    
    	onRequest: function( context ) {
    	
    		var resultsTable = '';
    				
			if ( context.request.method == 'POST' ) {
				keywords = context.request.parameters.keywords;
			}

			var form = serverWidget.createForm(
				{
					title: 'Power Search',
					hideNavBar: false
				}
			);			
									
			var htmlField = form.addField( { id: 'custpage_field_html', type: serverWidget.FieldType.INLINEHTML, label: 'HTML' } );				
			
			htmlField.defaultValue = generateSearchForm() + generateSearchResults() + generateAttribution();				
			
			context.response.writePage( form );	
			
        }
        
    }

}


function generateAttribution() {

	return `
		<p style="margin-top: 24px; text-align: center; margin-bottom: 0px;">
			Power Search Version ${version}. 
			Developed by <a href="https://timdietrich.me/" target="_tim" style="color: #4d5f79;">Tim Dietrich</a>.
		</p>
	`;
	
}	


function generateSearchForm() {

	return `
	
		<!-- Bootstrap -->		
		<!-- https://getbootstrap.com -->		
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
		<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>	
		
		<!-- DataTables -->
		<!-- https://datatables.net -->
		<link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.25/css/jquery.dataTables.css">
		<script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.25/js/jquery.dataTables.js"></script>			
		
		<style type = "text/css"> 

			input[type="text"], input[type="search"], textarea, button {
				outline: none;
				box-shadow:none !important;
				border: 1px solid #ccc !important;
			}
	
			p, pre {
				font-size: 10pt;
			}
	
			td, th { 
				font-size: 10pt;
				border: 1px;
			}
	
			th {
				font-weight: bold;				
			}
	
		</style>		
	
		<form method="POST" action=".">
		
			<table>
				<tbody>
					<tr>
						<td style="text-align: left;">
							<input type="search" name="keywords" value="${keywords}" class="form-control" placeholder="enter keywords" autofocus required>
						</td>					
						<td style="text-align: center;">
							<button type="submit" class="btn btn-md btn-success" style="margin-left: 3px;" id="submitButton">Search &gt;</button>
						</td>			
					</tr>
				</tbody>		
			</table>	
		
		</form>	
		
	`;

}


function generateSearchResults() {

	if ( keywords == '' ) {
		return '';
	}

	var rows = performSearch();
	
	if ( rows.length == 0 ) {	
		return '<p>Sorry, but nothing was found.</p>';
	}
	
	var tableRows = '';
		
	for ( i = 0; i < rows.length; i++ ) {
	
		var row = rows[i];
				
		var url = '';
		
		var urlsCell = '';
		
		switch ( row.recordtype ) {
			case 'Entity':
				switch ( row.subtype ) {
					case 'Customer':
						url = `/app/common/entity/custjob.nl?id=${row.id}`;
						break;										
					case 'Vendor':
						url = `/app/common/entity/vendor.nl?id=${row.id}`;
						break;
					default:
						url = `/app/common/entity/entity.nl?id=${row.id}`;
						break;							
				}				
				break;
			case 'Item':
				url = `/app/common/item/item.nl?id=${row.id}`;
				break;
			case 'Fulfillment':
				url = `/app/accounting/transactions/transaction.nl?id=${row.id}`;
				break;					
			case 'Transaction':
				url = `/app/accounting/transactions/transaction.nl?id=${row.id}`;
				break;														
		}
		
		if ( url != '' ) {
			urlsCell = `<a href="${url}&e=t" target="_new">Edit</a> | <a href="${url}" target="_new">View</a>`;
		}
		
		if ( row.recordtype == 'File' ) {
			urlsCell = `<a href="/app/common/media/mediaitem.nl?id=${row.id}&e=T" target="_new">Edit</a> | <a href="${row.custom1}" target="_new">View</a>`;
			row.custom1 = '';
		}
		
		var tableRow = `
			<tr>
				<td style="text-align: center;">${urlsCell}</td>
				<td style="text-align: center;">${row.subtype}</td>
				<td style="text-align: left;">${row.recordid}</td>
				<td style="text-align: center;">${row.id}</td>
				<td style="text-align: center;">${row.status}</td>	
				<td style="text-align: center;">${row.trandate}</td>			
				<td style="text-align: left;">${row.custom1}</td>
			</tr>
		`;
		
		tableRows += tableRow;	
						
	}	
	
	tableRows = tableRows.replaceAll(">null<",">&nbsp;<");	
		
	return `
			
		<p style="margin-top: 36px; font-weight: 600;">
			${rows.length} records were found.
		</p>
		
		<table id="resultsTable" name="resultsTable" class="table table-striped table-bordered" style="margin-top: 18px;">
			<thead>
				<tr style="background-color: #eee;">
					<th style="width: 10%; text-align: center;">Links</th>
					<th style="width: 10%; text-align: center;">Type</th>
					<th style="width: 20%; text-align: left;">Name / ID</th>					
					<th style="width: 10%; text-align: center;">Internal ID</th>				
					<th style="width: 10%; text-align: center;">Status</th>	
					<th style="width: 10%; text-align: center;">Date</th>				
					<th style="width: 20%; text-align: left;">Additional Information</th>
				</tr>
			<thead>
			<tbody>
				${tableRows}
			</tbody>		
		</table>	
		
		<script type="text/javascript">		
			window.jQuery = window.$ = jQuery;			
			$('#resultsTable').DataTable(
				{
					order: [[1, 'asc']],
				}
			);			
		</script>
		
	`;

}


function performSearch() {

	var sql = `
	
		
		-- Transaction
		SELECT
			ID,
			TranID AS RecordID,
			'Transaction' AS RecordType,
			BUILTIN.DF( Type ) AS SubType,	
			REPLACE( BUILTIN.DF( Status ), BUILTIN.DF( Type ) || ' : ', '' ) AS Status,
			ExternalID,
			BUILTIN.DF( Entity ) || '<br>'
				|| CASE WHEN OtherRefNum IS NULL THEN '' ELSE ( 'Ref # ' || OtherRefNum || '<br>' ) END
				|| CASE WHEN Memo IS NULL THEN '' ELSE ( 'Memo: ' || Memo || '<br>'  ) END
				AS Custom1,
			TranDate
		FROM
			Transaction
		WHERE
			(
				( UPPER( TranID ) LIKE ? )
			)
				
	`;
	
	var queryParams = [];
	
	var keywordsFilter = keywords.toUpperCase();
	
	if ( ! keywordsFilter.includes( "%" ) ) {
		keywordsFilter = "%" + keywordsFilter + "%";
	}
	
	var paramCount = 1;
	
	for (let i = 0; i < paramCount; i++) {
		queryParams.push( keywordsFilter );
	}
	
	var rows = query.runSuiteQL( { query: sql, params: queryParams } ).asMappedResults();
	
	return rows;	

}






