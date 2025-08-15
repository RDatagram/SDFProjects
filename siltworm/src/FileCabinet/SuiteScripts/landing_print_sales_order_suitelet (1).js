/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *
 */
 define([
  "N/record",
  "N/log",
  "N/render",
  "N/file",
  "N/search",
  "N/format",
], function (record, log, render, file, search, format) {
  /**
   *
   * @param {*} set
   */
  /**
   * main function for suitelet
   * @param {object} ctx
   */

  const onRequest = (ctx) => {
    try {
      var req = ctx.request;
      var res = ctx.response;
      var params = req.parameters;
      // log.debug("params", params);
      bill_template(ctx);
    } catch (e) {
      log.error("ERROR onRequest", e);
    }
  };

  function bill_template(ctx) {
    var req = ctx.request;
    var res = ctx.response;
    var recID = req.parameters.id;
    var recType = req.parameters.rectype;
    log.debug("recID", recID);
    // log.debug("recType", recType);
    var salesOrderSrchHeader = search.create({
        type: "salesorder",
        filters:
        [
           ["type","anyof","SalesOrd"], 
           "AND", 
           ["internalid","anyof",recID]
        ],
        columns:
        [
           "tranid",
           "trandate",
           "billaddress",
           "shipaddress",
           "paymentmethod",
           "otherrefnum",
           "shipmethod",
           "shipdate"
        ]
     });
     var soHeadCount = salesOrderSrchHeader.runPaged().count;
    //  log.debug("salesOrderSrchHeader result count",soHeadCount);

     var soHeadRange = salesOrderSrchHeader.run().getRange({
        start: 0,
        end: 1000
     });
     if (soHeadCount) {
        var orderNo = soHeadRange[0].getValue({name: "tranid"});
        var date = soHeadRange[0].getValue({name: "trandate"});
        var billTo = soHeadRange[0].getValue({name: "billaddress"});
        var shipTo = soHeadRange[0].getValue({name: "shipaddress"});
        var paymentMethod = soHeadRange[0].getValue({name: "paymentmethod"});
        var poNo = soHeadRange[0].getValue({name: "otherrefnum"});
        var shippingMethod = soHeadRange[0].getValue({name: "shipmethod"});
        var shipDate = soHeadRange[0].getValue({name: "shipdate"});

        if (billTo) {
            billTo = handleAmpersant(billTo);
        }
        if (shipTo) {
            shipTo = handleAmpersant(shipTo);
        }
     }

    var temp_string =
      '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">\
        <pdf>\
        <head>\
        <link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}" src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}" src-bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2" />\
        <macrolist>\
        <macro id="nlheader">\
            <table style="width: 100%; font-size: 10pt;">\
                <tr>\
				    <td rowspan="3" style="width:115px;padding: 0;"><br />\
				        <img src="http://5702194.shop.netsuite.com/core/media/media.nl?id=142903&amp;c=5702194&amp;h=NW5VuvDXZ4JfBWKiGtG_nWpfBXRFQnwGLqdQfGIwSJ8VIiuJ" style="float: left; margin: 7px; height: 100px; width: 115px;" />\
				    </td>\
				    <td rowspan="3" style="padding-top:15px;">4088 W 82nd Ct.<br />Merrillville IN 46410<br />United States</td>\
				    <td align="right" style="padding: 0;"><span style="font-size: 28pt;">Bill of Lading</span></td>\
			  </tr>\
			  <tr>\
				    <td align="right" style="padding: 0;"><span style="font-size: 16pt;">#'+orderNo+'</span></td>\
			    </tr>\
			    <tr>\
				    <td align="right" style="padding: 0;">'+date+'</td>\
			    </tr>\
			</table>\
        </macro>\
        <macro id="nlfooter">\
          <table style="width: 100%; font-size: 8pt;"><tr>\
			<td style="padding: 0;">&nbsp;</td>\
			<td align="right" style="padding: 0;"><pagenumber/> of <totalpages/></td>\
		  </tr></table>\
        </macro>\
    </macrolist>\
    <style type="text/css">\
		table {\
			font-size: 9pt;\
			table-layout: fixed;\
		}\
        th {\
            font-weight: bold;\
            font-size: 8pt;\
            vertical-align: middle;\
            padding: 5px 6px 3px;\
            background-color: #e3e3e3;\
            color: #333333;\
        }\
        td {\
            padding: 4px 6px;\
        }\
		td p { align:left }\
	</style>\
	</head>\
	<body header="nlheader" header-height="16%" footer="nlfooter" footer-height="20pt" padding="0.5in 0.5in 0.5in 0.5in" size="Letter">\
<table style="width: 100%; margin-top: 5px;">\
<tr>\
<td colspan="2" style="font-size: 8pt; padding: 6px 0 2px; font-weight: bold; color: #333333;">Bill To</td>\
<td colspan="4">  </td>>\
<td colspan="2" style="font-size: 8pt; padding: 6px 0 2px; font-weight: bold; color: #333333;">Ship To</td>\
<td colspan="4">  </td>>\
</tr>\
<tr>\
<td colspan="2" style="padding: 0;">'+billTo+'</td>\
<td colspan="4">  </td>>\
<td colspan="2" style="padding: 0;">'+shipTo+'</td>\
<td colspan="4">  </td>>\
</tr></table>\
      <table style="width: 100%; margin-top: 10px;"><tr>\
			<th>Payment Method</th>\
			<th>Customer PO#</th>\
			<th>Shipping Method</th>\
			<th>Ship Date</th>\
		</tr>\
		<tr>\
			<td style="padding-top: 2px;">'+paymentMethod+'</td>\
			<td style="padding-top: 2px;">'+poNo+'</td>\
			<td style="padding-top: 2px;">'+shippingMethod+'</td>\
			<td style="padding-top: 2px;">'+shipDate+'</td>\
		</tr></table>\
		<table style="width: 100%; margin-top: 10px;">\
		<thead>\
		<tr>\
			<th align="center" colspan="3" style="padding: 10px 6px;">Quantity</th>\
			<th align="left" colspan="12" style="padding: 10px 6px;">Item</th>\
      <th align="left" colspan="12" style="padding: 10px 6px;">Description</th>\
		</tr>\
		</thead>';

        var salesorderSearchLine = search.create({
            type: "salesorder",
            filters:
            [
               ["type","anyof","SalesOrd"], 
               "AND", 
               ["internalid","anyof",recID], 
               "AND", 
               ["item","noneof","@NONE@"], 
               "AND", 
               ["taxline","is","F"]
            ],
            columns:
            [
              "quantity",
              "item",
              "memo",
            ]
        });
        var searchResultCount = salesorderSearchLine.runPaged().count;
        //log.debug("salesorderSearchLine result count",searchResultCount);
        var soLineRange = salesorderSearchLine.run().getRange({
            start: 0,
            end: 1000
         });
         if (searchResultCount) {
            for (var i = 0; i < searchResultCount; i++) {
                var quantity = soLineRange[i].getValue({name: "quantity"});
                var item = soLineRange[i].getText({name: "item"});
                var description = soLineRange[i].getValue({name: "memo"});
                item = handleAmpersant(item);
                if (description) {
                    description = handleAmpersant(description);
                }
                temp_string+='<tr>\
                <td align="center" colspan="3" line-height="150%">'+quantity+'</td>\
                <td colspan="8"><span style="font-weight: bold; line-height: 150%; color: #333333;">'+item+'</span></td>\
                <td colspan="16"><span style="font-weight: bold; line-height: 150%; color: #333333;">'+description+'</span></td>\
                  </tr>';
            }
         }
		
		temp_string+='</table>\
		<hr style="width: 100%; color: #d3d3d3; background-color: #d3d3d3; height: 1px;" />\
        &nbsp;\
        <table style="width: 100%; font-size: 8pt;"><tr>\
          <td align="center" style="border-top: 1px; margin: 15px;">Company Name</td>\
          <td align="center" style="border-top: 1px; margin: 15px;">Customer Name</td>\
          <td align="center" style="border-top: 1px; margin: 15px;">Carrier</td>\
        </tr></table>\
	</body>\
    </pdf>';

    res.renderPdf(temp_string);
  }
  function handleAmpersant(string) {
    if (string.includes("&")) {
      var result = string.replace(/&/gi, "&amp;");
      return result;
    } else {
      return string;
    }
  }
  return {
    onRequest: onRequest,
  };
});
