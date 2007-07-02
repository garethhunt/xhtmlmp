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
 * The Original Code is the Modify Headers extension.
 * 
 * The Initial Developer of the Original Code is Gareth Hunt.
 * Portions created by the Initial Developer
 * are Copyright (C) 2004 the Initial Developer. All Rights Reserved.
 *
 * The Original Code has been modified to support XHTML mobile profile.
 * The modified code is Copyright (C) 2006 Gareth Hunt.
 *
 * Contributor(s): 
 *
 * This file contains the logging service for the XHTMLMP extension
 */

/*
 * TODO: Set a preference observer so that the loglevel can be monitered
 */


function XhtmlMPLogger() {
  this._initialised = false
  this._loggingPref = "extensions.xhtmlmp.config.log.level"
  this.gConsoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService)
  this.scriptError = Components.classes["@mozilla.org/scripterror;1"]
  
  // Log levels
  this.ERROR = 0
  this.WARN = 1
  this.INFO = 2
  this.DEBUG = 3
  this.logLevel = this.ERROR
  this.logLevelAsString = new Array("ERROR", "WARN", "INFO", "DEBUG")
}

XhtmlMPLogger.prototype = {
  
  get wrappedJSObject() {
    if (!this._initialised) {
      this.init()
    }
    return this
  },
  
  init: function() {
    if (!this._initialised) {
      
      var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch)
      
      try {
        this.logLevel = prefService.getIntPref(this._loggingPref)
      } catch (e) {
        prefService.setIntPref(this._loggingPref, this.logLevel)
      }
      
      this._initialised = true
    }
  },
  
  error: function(msg) {
    if(this.logLevel >= this.ERROR) {
      var error = this.scriptError.createInstance(Components.interfaces.nsIScriptError)
      error.init(msg, null, null, null, null, Components.interfaces.nsIScriptError.errorFlag, null)
      this._log(error)
    }
  },
  
  warn: function(msg) {
    if(this.logLevel >= this.WARN) {
      var error = this.scriptError.createInstance(Components.interfaces.nsIScriptError)
      error.init(msg, null, null, null, null, Components.interfaces.nsIScriptError.warningFlag, null)
      this._log(error)
    }
  },
  
  info: function(msg) {
    if(this.logLevel >= this.INFO) {
      this._logString(this.logLevelAsString[this.INFO], msg)
    }
  },
  
  debug: function(msg) {
    if(this.logLevel >= this.DEBUG) {
      this._logString(this.logLevelAsString[this.DEBUG], msg)
    }
  },
  
  _log: function (scriptError) {
    this.gConsoleService.logMessage(scriptError)
  },
  
  _logString: function(level, msg) {
    this.gConsoleService.logStringMessage(level + ": " + msg)
  },
  
  QueryInterface: function (iid) {

    if (iid.equals(Components.interfaces.nsISupports))
        return this

    throw Components.results.NS_ERROR_NO_INTERFACE
  }
}

var XhtmlMPLoggingModule = {
  cid: Components.ID("{84c7fe65-1e57-412b-bd09-6e3612fd3fdb}"),
  name: "XHTML MP Logging Component",
  contractID: "@xhtmlmp.mozdev.org/logger;1",
  firstTime: true,
  
  // Register the component with the browser
  registerSelf: function (compMgr, fileSpec, location, type) {
    if (this.firstTime) {
      this.firstTime = false
      throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN
    }
    
    // Register the objects with the component manager
    var compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar)
    compMgr.registerFactoryLocation(this.cid, this.name, this.contractID, fileSpec, location, type)
  },
  
  // Removes the component from the app-startup category
  unregisterSelf: function(compMgr, fileSpec, location) {
    varaCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar)
    aCompMgr.unregisterFactoryLocation(this.cid, location)
  },
  
  // Return the Factory object
  getClassObject: function (compMgr, cid, iid) {
        
    if (!iid.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED
    
    // Check that the component ID is the XHTMLMP Logger
    if (cid.equals(this.cid)) {
      return this.factory
    }
    
    throw Components.results.NS_ERROR_NO_INTERFACE
  },
  
  // This factory method returns an anonymous class 
  factory: {
    createInstance: function (outer, iid) {
      if (outer != null)
        throw Components.results.NS_ERROR_NO_AGGREGATION
      
      if (iid.equals(Components.interfaces.nsISupports)) {
        return new XhtmlMPLogger()
      }
      
      throw Components.results.NS_ERROR_NO_INTERFACE
    }
  },
  
  canUnload: function(compMgr) {
    return true
  }
}

/* entrypoint */
function NSGetModule(compMgr, fileSpec) {
    return XhtmlMPLoggingModule
}
