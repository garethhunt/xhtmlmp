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
function MultipartMixedStreamConverter() {}

MultipartMixedStreamConverter.prototype = {
  
  _logger: null,
  _initialised: false,
  
  init: function() {
    if (this._initialised) { return }
    this._logger = Components.classes["@xhtmlmp.mozdev.org/logger;1"].getService(Components.interfaces.nsISupports).wrappedJSObject
  },
  
  QueryInterface: function(iid) {
    if (iid.equals(Components.interfaces.nsISupports) ||
      iid.equals(Components.interfaces.nsIStreamConverter) ||
      iid.equals(Components.interfaces.nsIStreamListener) ||
      iid.equals(Components.interfaces.nsIRequestObserver))
      return this

    throw Components.results.NS_ERROR_NO_INTERFACE
  },
  
  // nsIRequest::onStartRequest
  onStartRequest: function(aRequest, aContext) {
    if (!this._initialised) { this.init() }
    this._logger.debug("Entered onStartRequest")
    
    this.data = ''

    this.uri = aRequest.QueryInterface (Components.interfaces.nsIChannel).URI.spec

    this.channel = aRequest
    this._logger.debug(this.channel.contentType)
    
    this.channel.contentType = "text/xml"
    this._logger.debug(this.channel.contentType)

    this.listener.onStartRequest (this.channel, aContext)
    this._logger.debug("Exiting onStartRequest")
  },
  
  // nsIRequest::onStopRequest
  onStopRequest: function (aRequest, aContext, aStatusCode) {
    this._logger.debug("this.data: " + this.data)
    var tempData = this.data

    // Strip out multipart/mixed delimiters and information
    tempData = tempData.replace (/--next\.part.*/g,'')
    tempData = tempData.replace (/Content-Location.*/g,'')
    tempData = tempData.replace (/Content-Type.*/g,'')
    tempData = tempData.replace (/Content-Transfer-Encoding.*/g,'')
    
    // Remove everything after the closing html tag
    var htmlEndIndex = tempData.search(/<\/html>/)
    this._logger.debug("Index of end tag: " + htmlEndIndex)
    tempData = tempData.substring(0, htmlEndIndex + 7)
    
    // Strip leading whitespace
    tempData = tempData.replace (/^\s+/,'')
    
    // Strip out comments
    tempData = tempData.replace (/<!(?:--.*?--\s*)?>/,'')
    
    // Replace <html> with <html xmlns="http://www.w3.org/1999/xhtml">
    tempData = tempData.replace (/<html>/,'<html xmlns="http://www.w3.org/1999/xhtml">')
    
    // Prepend </title> with [XHTML-MP]
    tempData = tempData.replace (/<\/title>/,' [Multipart/Mixed]</title>')
    
    this.data = tempData
    this._logger.debug("this.data: " + this.data)
    
    var targetDocument = ""
    
    // If there is no XML declaration, add it
    if ( !(this.data.search(/^<\?xml version=['"]1.0['"] encoding=['"]UTF-8['"]\?>.*$/)) ) {
    	targetDocument = "<?xml version='1.0' encoding='UTF-8'?>"
    }
    
    var targetDocument = targetDocument + this.data
    
    this._logger.debug("targetDocument: " + targetDocument)

    var sis = Components.classes["@mozilla.org/io/string-input-stream;1"].createInstance(Components.interfaces.nsIStringInputStream)
    sis.setData (targetDocument, targetDocument.length)

    // Pass the data to the main content listener
    this.listener.onDataAvailable (this.channel, aContext, sis, 0, targetDocument.length)
    this.listener.onStopRequest (this.channel, aContext, aStatusCode)
  },
  
  // nsIStreamListener methods
  onDataAvailable: function (aRequest, aContext, aInputStream, aOffset, aCount) {
    this._logger.debug("Entered onDataAvailable")
    
    var si = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance()
    si = si.QueryInterface(Components.interfaces.nsIScriptableInputStream)
    si.init(aInputStream)
    this.data += si.read(aCount)
    
    this._logger.debug("Exiting onDataAvailable")
  },
  
  asyncConvertData: function (aFromType, aToType, aListener, aCtxt) {
    // Store the listener passed to us
    this.listener = aListener
  },
  
  convert: function (aFromStream, aFromType, aToType, aCtxt) {
    return aFromStream
  }
}

var MultipartMixedBrowserModule = {
  
  cid: Components.ID("{1d880b4f-d091-439d-b3c4-f175966c9341}"),
  conversion: "?from=multipart/mixed&to=*/*",
  contractID: "@mozilla.org/streamconv;1",
  name: "Multipart/Mixed to HTML stream converter",
  
  // This factory attribute returns an anonymous class 
  factory: {
    createInstance: function (outer, iid) {
      if (outer != null)
        throw Components.results.NS_ERROR_NO_AGGREGATION
      
      if (iid.equals(Components.interfaces.nsISupports) ||
        iid.equals(Components.interfaces.nsIStreamConverter) ||
        iid.equals(Components.interfaces.nsIStreamListener) ||
        iid.equals(Components.interfaces.nsIRequestObserver)) {
        
        return new MultipartMixedStreamConverter()
      }
      
      throw Components.results.NS_ERROR_NO_INTERFACE
    }
  },
  
  registerSelf: function (compMgr, fileSpec, location, type) {
  
    compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar)
    compMgr.registerFactoryLocation(this.cid, this.name, this.contractID + this.conversion, fileSpec, location, type)
    
    var catman = Components.classes["@mozilla.org/categorymanager;1"].getService(Components.interfaces.nsICategoryManager)
    catman.addCategoryEntry(this.contractID, this.conversion, this.name, true, true)
  },
  
  unregisterSelf: function(compMgr, fileSpec, location) {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar)
    aCompMgr.unregisterFactoryLocation(this.cid, aLocation)
  },
  
  getClassObject: function (compMgr, cid, iid) {
  
    if (cid.equals(this.cid))
      return this.factory
    
    if (!iid.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED
    
    throw Components.results.NS_ERROR_NO_INTERFACE
  },
  
  canUnload: function(compMgr) { return true }
}

/* entrypoint */
function NSGetModule(compMgr, fileSpec) {
    return MultipartMixedBrowserModule
}
