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
 * The modified code is Copyright (C) 2005 Gareth Hunt.
 *
 * Contributor(s): 
 *
 * This file contains the content handler for converting content of type
 * text/vnd.wap.wml (WMLStreamConverter)
 */

/* components defined in this file */

const XHTMLMPSTREAM_CONVERT_CONVERSION =
    "?from=application/vnd.wap.xhtml+xml&to=*/*";
const XHTMLMPSTREAM_CONVERTER_CONTRACTID =
    "@mozilla.org/streamconv;1" + XHTMLMPSTREAM_CONVERT_CONVERSION;
const XHTMLMPSTREAM_CONVERTER_CID =
    Components.ID("{333c7e10-e060-4514-9e35-08d2183aee2d}");

/* application/vnd.wap.xhtml+xml -> text/html stream converter */
function XHTMLMPStreamConverter ()
{
}

XHTMLMPStreamConverter.prototype.QueryInterface =
function (iid) {

    if (iid.equals(Components.interfaces.nsISupports) ||
        iid.equals(Components.interfaces.nsIStreamConverter) ||
        iid.equals(Components.interfaces.nsIStreamListener) ||
        iid.equals(Components.interfaces.nsIRequestObserver))
        return this;

    throw Components.results.NS_ERROR_NO_INTERFACE;

}

// nsIRequest observer methods
XHTMLMPStreamConverter.prototype.onStartRequest =
function (aRequest, aContext) {

    this.data = '';

    this.uri = aRequest.QueryInterface (Components.interfaces.nsIChannel).URI.spec;

    this.channel = aRequest;
    xhtmlmp_logMessage(this.channel.contentType);
    
    this.channel.contentType = "text/xml";
    xhtmlmp_logMessage(this.channel.contentType);

    this.listener.onStartRequest (this.channel, aContext);

};

XHTMLMPStreamConverter.prototype.onStopRequest =
function (aRequest, aContext, aStatusCode) {

    xhtmlmp_logMessage(this.data);

    // Strip leading whitespace
    this.data = this.data.replace (/^\s+/,'');
    
    // Strip out comments
    this.data = this.data.replace (/<!--[.*]-->/,'');

    // Parse the content into an XMLDocument
    // (NB 'new DOMParser()' doesn't work from within a component it seems)
    var parser =
        Components.classes['@mozilla.org/xmlextras/domparser;1']
             .getService(Components.interfaces.nsIDOMParser);
    var originalDoc = parser.parseFromString(this.data, "text/xml");
    
    // Default XSLT stylesheet
    var xslt = "chrome://xhtmlmp/content/xhtmlmp.xsl";

    var roottag = originalDoc.documentElement;
    if ((roottag.tagName == "parserError") ||
        (roottag.namespaceURI == "http://www.mozilla.org/newlayout/xml/parsererror.xml")){
        // Use error stylesheet
        //var xslt = "chrome://xhtmlmp/content/errors.xsl";
    }

    // Find out what interface we need to use for document transformation
    // (earlier builds used text/xsl)
    var transformerType;
    if (Components.classes["@mozilla.org/document-transformer;1?type=xslt"]) {
        transformerType = "xslt";
    } else {
        transformerType = "text/xsl";
    }
    xhtmlmp_logMessage(transformerType);
    
    var processor = Components.classes["@mozilla.org/document-transformer;1?type=" + transformerType]
        .createInstance(Components.interfaces.nsIXSLTProcessor);

    // Use an XMLHttpRequest object to load our own stylesheet.
    var styleLoad =
        Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
        .createInstance(Components.interfaces.nsIXMLHttpRequest);
    styleLoad.open ("GET", xslt, false); // synchronous load
    styleLoad.overrideMimeType("text/xml");
    styleLoad.send(undefined);
    processor.importStylesheet (styleLoad.responseXML.documentElement);

    // Get the transformed document
    var transformedDocument = processor.transformToDocument (originalDoc);
    
    var serializer =
        Components.classes["@mozilla.org/xmlextras/xmlserializer;1"]
        .createInstance (Components.interfaces.nsIDOMSerializer);
        
    xhtmlmp_logMessage(serializer.serializeToString(originalDoc));
    xhtmlmp_logMessage(serializer.serializeToString(transformedDocument));

    // and serialize it to XML
    // This is a BIG HACK
    var str = Components.classes["@mozilla.org/supports-string;1"].
                   createInstance(Components.interfaces.nsISupportsString);
    str.data = '';
    var outputStream = {
        write: function(buf, count) {
           str.data += buf.substring(0,count);
           return count;
       }
    };
    serializer.serializeToStream (transformedDocument, outputStream, "UTF-8");
    var targetDocument = "<?xml version='1.0' encoding='UTF-8'?>" + str.data;
    
    xhtmlmp_logMessage(targetDocument);

    var sis =
        Components.classes["@mozilla.org/io/string-input-stream;1"]
        .createInstance(Components.interfaces.nsIStringInputStream);
    sis.setData (targetDocument, targetDocument.length);

    // Pass the data to the main content listener
    this.listener.onDataAvailable (this.channel, aContext, sis, 0, targetDocument.length);

    this.listener.onStopRequest (this.channel, aContext, aStatusCode);

};

// nsIStreamListener methods
XHTMLMPStreamConverter.prototype.onDataAvailable =
function (aRequest, aContext, aInputStream, aOffset, aCount) {

    var si = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance();
    si = si.QueryInterface(Components.interfaces.nsIScriptableInputStream);
    si.init(aInputStream);
    this.data += si.read(aCount);

}

// nsIStreamConverter methods
// old name (before bug 242184)...
XHTMLMPStreamConverter.prototype.AsyncConvertData =
function (aFromType, aToType, aListener, aCtxt) {
    this.asyncConvertData (aFromType, aToType, aListener, aCtxt);
}

// renamed to...
XHTMLMPStreamConverter.prototype.asyncConvertData =
function (aFromType, aToType, aListener, aCtxt) {
    // Store the listener passed to us
    this.listener = aListener;
}

// Old name (before bug 242184):
XHTMLMPStreamConverter.prototype.Convert =
function (aFromStream, aFromType, aToType, aCtxt) {
    return this.convert (aFromStream, aFromType, aToType, aCtxt);
}

// renamed to...
XHTMLMPStreamConverter.prototype.convert =
function (aFromStream, aFromType, aToType, aCtxt) {
    return aFromStream;
}

/* stream converter factory object (XHTMLMPStreamConverter) */
var XHTMLMPStreamConverterFactory = new Object();

XHTMLMPStreamConverterFactory.createInstance =
function (outer, iid) {
    if (outer != null)
        throw Components.results.NS_ERROR_NO_AGGREGATION;

    if (iid.equals(Components.interfaces.nsISupports) ||
        iid.equals(Components.interfaces.nsIStreamConverter) ||
        iid.equals(Components.interfaces.nsIStreamListener) ||
        iid.equals(Components.interfaces.nsIRequestObserver))

        return new XHTMLMPStreamConverter();

    throw Components.results.NS_ERROR_INVALID_ARG;

}

var XHTMLMPBrowserModule = new Object();

XHTMLMPBrowserModule.registerSelf =
function (compMgr, fileSpec, location, type)
{

    var compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);

    compMgr.registerFactoryLocation(XHTMLMPSTREAM_CONVERTER_CID,
                                    "XHTMLMP Stream Converter",
                                    XHTMLMPSTREAM_CONVERTER_CONTRACTID, 
                                    fileSpec,
                                    location, 
                                    type);

    var catman = Components.classes["@mozilla.org/categorymanager;1"]
                     .getService(Components.interfaces.nsICategoryManager);
    catman.addCategoryEntry("@mozilla.org/streamconv;1",
                            XHTMLMPSTREAM_CONVERT_CONVERSION,
                            "XHTMLMP to HTML stream converter",
                            true, true);
};

XHTMLMPBrowserModule.unregisterSelf =
function(compMgr, fileSpec, location)
{
}

XHTMLMPBrowserModule.getClassObject =
function (compMgr, cid, iid) {

    if (cid.equals(XHTMLMPSTREAM_CONVERTER_CID))
        return XHTMLMPStreamConverterFactory;

    if (!iid.equals(Components.interfaces.nsIFactory))
        throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    throw Components.results.NS_ERROR_NO_INTERFACE;
    
}

XHTMLMPBrowserModule.canUnload =
function(compMgr)
{
    return true;
}

/* entrypoint */
function NSGetModule(compMgr, fileSpec) {
    return XHTMLMPBrowserModule;
}

// A logger
var gConsoleService = Components.classes['@mozilla.org/consoleservice;1']
                    .getService(Components.interfaces.nsIConsoleService);

function xhtmlmp_logMessage(aMessage) {
  gConsoleService.logStringMessage('xhtmlmp: ' + aMessage);
}
