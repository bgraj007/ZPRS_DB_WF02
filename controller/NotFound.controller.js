sap.ui.define([
		"workspace/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("workspace.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);