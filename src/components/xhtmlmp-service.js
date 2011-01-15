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
 * The Original Code has been modified to support XHTML mobile profile.
 * The modified code is Copyright (C) 2006 Gareth Hunt.
 *
 * Contributor(s): 
 *
 * This file contains the content handler for converting content of type
 * application/vnd.wap.xhttml+xml (XHTMLMPStreamConverter)
 */

/* application/vnd.wap.xhtml+xml -> text/html stream converter */
if (!XHTMLMP)
	var XHTMLMP = {};

if (!XHTMLMP.StreamConverter) {
	Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
	
	XHTMLMP.StreamConverter = function () {};
	XHTMLMP.StreamConverter.prototype = {
		classDescription: "XHTMLMP to HTML stream converter",
		classID:          Components.ID("{333c7e10-e060-4514-9e35-08d2183aee2d}"),
		contractID:       "@mozilla.org/streamconv;1?from=application/vnd.wap.xhtml+xml&to=*/*",
		
		_xpcom_factory: {
			createInstance: function (outer, iid) {
				if (outer != null)
					throw Components.results.NS_ERROR_NO_AGGREGATION;
			
				if (iid.equals(Components.interfaces.nsISupports) ||
					iid.equals(Components.interfaces.nsIStreamConverter) ||
					iid.equals(Components.interfaces.nsIStreamListener) ||
					iid.equals(Components.interfaces.nsIRequestObserver)) {
					return new XHTMLMP.StreamConverter();
				}
				throw Components.results.NS_ERROR_NO_INTERFACE;
			}
		},
		
		QueryInterface: XPCOMUtils.generateQI (
			[Components.interfaces.nsIObserver,
			Components.interfaces.nsIStreamConverter,
			Components.interfaces.nsIStreamListener,
			Components.interfaces.nsIRequestObserver]
		),
		
		// nsIRequest::onStartRequest
		onStartRequest: function(aRequest, aContext) {
			this.data = "";
			this.uri = aRequest.QueryInterface (Components.interfaces.nsIChannel).URI.spec;
		    this.channel = aRequest;
		    this.channel.contentType = "text/xml";
		    this.listener.onStartRequest (this.channel, aContext);
		},
		
		// nsIRequest::onStopRequest
		onStopRequest: function (aRequest, aContext, aStatusCode) {
		    var tempData = this.data;

		    // Strip leading whitespace
		    tempData = tempData.replace (/^\s+/,'');
		    
		    // Strip out comments
		    tempData = tempData.replace (/<!(?:--.*?--\s*)?>/,'');
		    
		    // Replace <html> with <html xmlns="http://www.w3.org/1999/xhtml">
		    tempData = tempData.replace (/<html>/,'<html xmlns="http://www.w3.org/1999/xhtml">');
		    
		    // Prepend </title> with [XHTML-MP]
		    tempData = tempData.replace (/<\/title>/,' [XHTML-MP]</title>');
		    
		    this.data = tempData;
		    
		    var targetDocument = "";
		    
		    // TODO Review and determine if this is required
		    // If there is no XML declaration, add it
		    /* if ( !(this.data.search(/^<\?xml version=['"]1.0['"] encoding=['"]UTF-8['"]\?>.*$/)) ) {
		    	targetDocument = "<?xml version='1.0' encoding='UTF-8'?>";
		    } */
		    
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
	};
}

if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([XHTMLMP.StreamConverter]);
else
    var NSGetModule = XPCOMUtils.generateNSGetModule([XHTMLMP.StreamConverter]);
