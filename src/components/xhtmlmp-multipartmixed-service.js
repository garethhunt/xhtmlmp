/* 
 * The contents of this file are subject to the Mozilla Public
 * License Version 1.1 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 * 
 * The Original Code is the wmlbrowser extension.
 * 
 * The Initial Developer of the Original Code is Matthew Wilson
 * <matthew@mjwilson.demon.co.uk>. Portions created by the Initial Developer
 * are Copyright (C) 2004 the Initial Developer. All Rights Reserved.
 *
 * The Original Code has been modified to support Multipart/Mixed content.
 * The modified code is Copyright (C) 2006 Gareth Hunt.
 *
 * Contributor(s): 
 *
 * This file contains the content handler for converting content of type
 * multipart/mixed (MultipartMixedStreamConverter)
 */

/* multipart/mixed -> text/xml stream converter */
if (!XHTMLMP)
	var XHTMLMP = {};

if (!XHTMLMP.MultipartStreamConverter1) {
	Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
	
	XHTMLMP.MultipartStreamConverter1 = function () {};
	XHTMLMP.MultipartStreamConverter1.prototype = {
		classDescription: "multipart/mixed to HTML stream converter 1",
		classID:          Components.ID("{1d880b4f-d091-439d-b3c4-f175966c9341}"),
		contractID:       "@mozilla.org/streamconv;1?from=multipart/mixed&to=*/*",
		
		_xpcom_factory: {
			createInstance: function (outer, iid) {
				if (outer != null)
					throw Components.results.NS_ERROR_NO_AGGREGATION;
			
				if (iid.equals(Components.interfaces.nsISupports) ||
					iid.equals(Components.interfaces.nsIStreamConverter) ||
					iid.equals(Components.interfaces.nsIStreamListener) ||
					iid.equals(Components.interfaces.nsIRequestObserver)) {
					return new XHTMLMP.MultipartStreamConverterBase();
				}
				throw Components.results.NS_ERROR_NO_INTERFACE;
			}
		},
		
		QueryInterface: XPCOMUtils.generateQI (
			[Components.interfaces.nsIObserver,
			Components.interfaces.nsIStreamConverter,
			Components.interfaces.nsIStreamListener,
			Components.interfaces.nsIRequestObserver]
		)
	};
}

if (!XHTMLMP.MultipartStreamConverter2) {
	Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
	
	XHTMLMP.MultipartStreamConverter2 = function () {};
	XHTMLMP.MultipartStreamConverter2.prototype = {
		classDescription: "multipart/mixed to HTML stream converter 2",
		classID:          Components.ID("{1d880b4f-d091-439d-b3c4-f175966c9341}"),
		contractID:       "@mozilla.org/streamconv;1?from=application/vnd.wap.multipart.mixed&to=*/*",
		
		_xpcom_factory: {
			createInstance: function (outer, iid) {
				if (outer != null)
					throw Components.results.NS_ERROR_NO_AGGREGATION;
			
				if (iid.equals(Components.interfaces.nsISupports) ||
					iid.equals(Components.interfaces.nsIStreamConverter) ||
					iid.equals(Components.interfaces.nsIStreamListener) ||
					iid.equals(Components.interfaces.nsIRequestObserver)) {
					return new XHTMLMP.MultipartStreamConverterBase();
				}
				throw Components.results.NS_ERROR_NO_INTERFACE;
			}
		},
		
		QueryInterface: XPCOMUtils.generateQI (
			[Components.interfaces.nsIObserver,
			Components.interfaces.nsIStreamConverter,
			Components.interfaces.nsIStreamListener,
			Components.interfaces.nsIRequestObserver]
		)
	};
}

if (!XHTMLMP.MultipartStreamConverterBase) {
	
	XHTMLMP.MultipartStreamConverterBase = function () {};
	XHTMLMP.MultipartStreamConverterBase.prototype = {
			
		// nsIRequest::onStartRequest
		onStartRequest: function(aRequest, aContext) {
			this.data = '';
			this.uri = aRequest.QueryInterface (Components.interfaces.nsIChannel).URI.spec;
			this.channel = aRequest;
			this.channel.contentType = "text/xml";
			this.listener.onStartRequest (this.channel, aContext);
		},
			  
		// nsIRequest::onStopRequest
		onStopRequest: function (aRequest, aContext, aStatusCode) {
			var tempData = this.data;

			// Strip out comments
			tempData = tempData.replace (/<!(?:--.*?--\s*)?>/g,'');

			// Strip out multipart/mixed delimiters and information
			tempData = tempData.replace (/^\s?--.*$/gm,'');
			tempData = tempData.replace (/Content-Location.*/g,'');
			tempData = tempData.replace (/Content-Type.*/g,'');
			tempData = tempData.replace (/Content-Transfer-Encoding.*/g,'');

			// Remove everything after the closing html tag
			var htmlEndIndex = tempData.search(/<\/html>/);
			tempData = tempData.substring(0, htmlEndIndex + 7);

			// Strip leading whitespace
			tempData = tempData.replace (/^\s+/,'');

			// Replace <html> with <html xmlns="http://www.w3.org/1999/xhtml">
			tempData = tempData.replace (/<html>/,'<html xmlns="http://www.w3.org/1999/xhtml">');

			// Prepend </title> with [XHTML-MP]
			tempData = tempData.replace (/<\/title>/,' [Multipart/Mixed]</title>');

			this.data = tempData;

			var targetDocument = "";

			// If there is no XML declaration, add it
			if ( !(this.data.search(/^<\?xml version=['"]1.0['"] encoding=['"]UTF-8['"]\?>.*$/)) ) {
				targetDocument = "<?xml version='1.0' encoding='UTF-8'?>";
			}

			var targetDocument = targetDocument + this.data;

			var sis = Components.classes["@mozilla.org/io/string-input-stream;1"].createInstance(Components.interfaces.nsIStringInputStream);
			sis.setData (targetDocument, targetDocument.length);

			// Pass the data to the main content listener
			this.listener.onDataAvailable (this.channel, aContext, sis, 0, targetDocument.length);
			this.listener.onStopRequest (this.channel, aContext, aStatusCode);
		},

		// nsIStreamListener methods
		onDataAvailable: function (aRequest, aContext, aInputStream, aOffset, aCount) {
			var si = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance();
			si = si.QueryInterface(Components.interfaces.nsIScriptableInputStream);
			si.init(aInputStream);
			this.data += si.read(aCount);
		},

		asyncConvertData: function (aFromType, aToType, aListener, aCtxt) {
			// Store the listener passed to us
			this.listener = aListener;
		},

		convert: function (aFromStream, aFromType, aToType, aCtxt) {
			return aFromStream;
		}
	}
}

if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([XHTMLMP.MultipartStreamConverter1,XHTMLMP.MultipartStreamConverter2]);
else
    var NSGetModule = XPCOMUtils.generateNSGetModule([XHTMLMP.MultipartStreamConverter1,XHTMLMP.MultipartStreamConverter2]);