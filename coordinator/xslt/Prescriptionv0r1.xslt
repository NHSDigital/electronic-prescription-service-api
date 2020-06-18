<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:hl7="urn:hl7-org:v3" >
    <!-- 20050622 CAM added indent="no" to remove excess whitespace introduced with some transform engines -->
	<xsl:output method="xml" version="1.0" encoding="UTF-8" indent="no"/>
    <!-- 20050622 CAM added strip-space element to remove whitespace-only nodes from the output document -->
                <xsl:strip-space elements="*"/>
<!--This template sets the root node to Prescription-->
<xsl:template match="hl7:pertinentPrescription">
	<FragmentsToBeHashed>
		<Fragment>
			<xsl:copy-of select="hl7:author/hl7:time"/>
			<xsl:copy-of select="hl7:id[not(@extension)]"/>
		</Fragment>	
		<Fragment>
			<xsl:copy-of select="hl7:author/hl7:AgentPerson"/>	
		</Fragment>	
		<Fragment>
			<xsl:copy-of select="../../hl7:recordTarget"/>	
		</Fragment>	
		<xsl:for-each select="hl7:pertinentInformation2/hl7:pertinentLineItem">
			<Fragment>
				<xsl:apply-templates select="." mode="LineItem"/>			
			</Fragment>
		</xsl:for-each>
	</FragmentsToBeHashed>
</xsl:template>	

<!-- filtering out itemStatus and repeatNumber/low -->
<xsl:template match="@*|node()" mode="LineItem">
	<xsl:copy>
		<xsl:apply-templates select="@*|node()" mode="LineItem"/>
	</xsl:copy>
</xsl:template>
<xsl:template match="hl7:low[local-name(..)='repeatNumber']" mode="LineItem"/>
<!-- CM23092005 added filter for pertinentItemStatus -->
<xsl:template match="hl7:*[hl7:pertinentItemStatus]" mode="LineItem"/>
<!--This overrides the built in template that includes any text nodes in the output document-->
<xsl:template match="text()"/>


</xsl:stylesheet>
