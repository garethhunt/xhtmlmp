<?xml version="1.0" encoding="UTF-8" ?>
<!-- ***** BEGIN LICENSE BLOCK *****
   - Version: MPL 1.1/GPL 2.0/LGPL 2.1
   -
   - The contents of this file are subject to the Mozilla Public License Version
   - 1.1 (the "License"); you may not use this file except in compliance with
   - the License. You may obtain a copy of the License at
   - http://www.mozilla.org/MPL/
   -
   - Software distributed under the License is distributed on an "AS IS" basis,
   - WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
   - for the specific language governing rights and limitations under the
   - License.
   -
   - The Original Code is XSL transformation for Wireless Markup Language
   -
   - Contributor(s):
   -   Matthew Wilson <matthew@mjwilson.demon.co.uk>
   -
   - Alternatively, the contents of this file may be used under the terms of
   - either the GNU General Public License Version 2 or later (the "GPL"), or
   - the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
   - in which case the provisions of the GPL or the LGPL are applicable instead
   - of those above. If you wish to allow use of your version of this file only
   - under the terms of either the GPL or the LGPL, and not to allow others to
   - use your version of this file under the terms of the MPL, indicate your
   - decision by deleting the provisions above and replace them with the notice
   - and other provisions required by the LGPL or the GPL. If you do not delete
   - the provisions above, a recipient may use your version of this file under
   - the terms of any one of the MPL, the GPL or the LGPL.
   -
   - ***** END LICENSE BLOCK ***** -->
<xsl:stylesheet version="1.0"
       xmlns="http://www.w3.org/1999/xhtml"
       xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
       xmlns:error="http://www.mozilla.org/newlayout/xml/parsererror.xml">

  <xsl:output method="xml" version="1.0" encoding="UTF-8"
    doctype-system="http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"
    doctype-public="-//W3C//DTD XHTML 1.0 Transitional//EN" />

  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
          <title>wmlbrowser error</title>
          <link type="text/css" rel="stylesheet" href="chrome://wmlbrowser/content/errors.css"/>
      </head>
      <body>
          <h1>wmlbrowser error</h1>
          <p>wmlbrowser found an error trying to load this document.</p>
          <p>The error was:</p>
          <xsl:apply-templates select="error:parsererror"/>
          <p>If the error is because of undefined entities such as &amp;nbsp; then you may need to download the WML DTDs from the Options panel. If this also fails, then you may need to create a res/dtd subdirectory of your browser installation (this will be fixed in a future version of wmlbrowser).</p>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="error:parsererror">
      <p class="error"><xsl:apply-templates /></p>
  </xsl:template>

  <xsl:template match="error:sourcetext">
      <pre class="source"><xsl:apply-templates /></pre>
  </xsl:template>

</xsl:stylesheet>
