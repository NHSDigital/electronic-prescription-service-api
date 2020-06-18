<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.w3.org/2000/09/xmldsig#"
	xmlns:hl7="urn:hl7-org:v3" xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
	<xsl:output method="xml" version="1.0" encoding="UTF-8" indent="no"/>
	<xsl:template match="/">
		<xsl:for-each select="//ds:SignedInfo">
			<xsl:call-template name="doSignedInfo"><xsl:with-param name="s" select="."/></xsl:call-template>
		</xsl:for-each>
	</xsl:template>
	<xsl:template name="doSignedInfo">
		<xsl:param name="s"/><xsl:element name="SignedInfo"><xsl:call-template name="copyAttributes"><xsl:with-param name="e" select="$s"/></xsl:call-template><xsl:call-template name="copyChildren"><xsl:with-param name="e" select="."/></xsl:call-template></xsl:element>
	</xsl:template>
	<xsl:template name="copyAttributes"><xsl:param name="e"/><xsl:for-each select="$e/@*"><xsl:attribute name="{name(.)}"><xsl:value-of select="string(.)"/></xsl:attribute></xsl:for-each></xsl:template>
	<xsl:template name="copyChildren"><xsl:param name="e"/><xsl:for-each select="$e/*"><xsl:element name="{name(.)}"><xsl:call-template name="copyAttributes"><xsl:with-param name="e" select="."/></xsl:call-template><xsl:call-template name="copyChildren"><xsl:with-param name="e" select="."/></xsl:call-template><xsl:if test="count(./*)=0"><xsl:value-of select="."/></xsl:if></xsl:element></xsl:for-each></xsl:template>
</xsl:stylesheet>
