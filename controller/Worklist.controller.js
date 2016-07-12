sap.ui.define([
	"workspace/controller/BaseController",
	"workspace/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/routing/History",
	"sap/m/MessageBox",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem"
], function(BaseController, formatter, Filter, FilterOperator, History, messageBox, MessagePopover, MessagePopoverItem) {
	"use strict";

	return BaseController.extend("workspace.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 * 
		 * 
		 */
		onInit: function() {
			this._oDialog = this.getView().byId("busyDialog");
			this._oDialog.open();
			this._oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			this.refreshModel();

			var screenSize = window.screen.width + 10 + 'px';
			this.byId("idCOutAt").setMinScreenWidth(screenSize);
		},

		_handleErrorMessage: function(msg) {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			messageBox.error(msg, {
				styleClass: bCompact ? "sapUiSizeCompact" : ""
			});
		},

		onCheckInOut: function(evt) {
			var oTable = this.getView().byId("idTable");
			var oSelectedItems = oTable.getSelectedItems();

			if (oSelectedItems.length === 0) {
				var sMsg;
				sMsg = "Select atleast one Draft Bill!!!";
				sap.m.MessageToast.show(sMsg);
				return;
			}

			this._oDialog.open();
			var cInOut;
			if (evt.getSource().getText() === this._oResourceBundle.getText("checkInButtonText"))
				cInOut = "CIN";

			if (evt.getSource().getText() === this._oResourceBundle.getText("checkOutButtonText"))
				cInOut = "COUT";

			var oModel = this.getOwnerComponent().getModel();
			var saveParam = "/CheckoutSet";

			for (var i = 0; i < oSelectedItems.length; i++) {
				var oItem = oSelectedItems[i];
				var oContext = oItem.getBindingContext();
				var oSelectedBillDraft = {
					Vbeln: oContext.getProperty("Vbeln"),
					Action: cInOut,
					Comments: oContext.getProperty("Comments")
				};
				oModel.createEntry(saveParam, {
					properties: oSelectedBillDraft
				});

			}

			var that = this;
			oModel.submitChanges({
				success: function(oData, oSuccess) {
					var errorData = {};
					errorData.results = [];
					var receivedData = oData.__batchResponses[0].__changeResponses;

					for (var i = 0; i < receivedData.length; i++) {
						if (receivedData[i].data.Message !== "") {
							errorData.results.push(
								receivedData[i].data 
							);
						}
					}

					if (errorData.results.length !== 0) {
						var oModelStatus = new sap.ui.model.json.JSONModel();
						oModelStatus.setData(errorData.results);
						var oMessageTemplate = new MessagePopoverItem({
							type: sap.ui.core.MessageType.Error,
							title: '{Vbeln}',
							description: '{Message}'
						});

						var oMessagePopover = new MessagePopover({
							items: {
								path: '/',
								template: oMessageTemplate
							}
						});

						oMessagePopover.setModel(oModelStatus);
						// that.refreshModel();
						oMessagePopover.openBy(that.getView().byId("idFooter"));

					}
					// Raise Success Message
					var sMsg;
					if (cInOut === "CIN")
						sMsg = "Selected Bill Numbers are Checked-In Successfully!!!";
					else if (cInOut === "COUT")
						sMsg = "Selected Bill Numbers are Checked-Out Successfully!!!";
					sap.m.MessageToast.show(sMsg);

					that.refreshModel();

					// oModel.setRefreshAfterChange(true);
				},
				error: function(oErr) {

					that.refreshModel();
					///call error handle responce 
				}
			});

		},

		refreshModel: function() {
			// var oModel = this.getOwnerComponent().getModel();
			// oModel.refresh(true, true);
			var that = this;
			var oModel = that.getOwnerComponent().getModel();
			oModel.read("/DBListSet", {
				success: function(oData, response) {
					var oTableModel = new sap.ui.model.json.JSONModel(oData);
					that.getView().byId("idTable").setModel(oTableModel);
					that.getView().byId("idTable").bindItems("/results", that.getView().byId("idColumnListItem"));
					that._oDialog.close();
				},
				error: function(oError) {
					that._oDialog.close();
					var msg = jQuery.parseJSON(oError.responseText).error.message.value;
					that._handleErrorMessage(msg);
				}
			});
		},

		onPress: function(evt) {
			var oItems = evt.getParameter("listItems");
			for (var i = 0; i < oItems.length; i++) {

				var oComments = oItems[i].getCells()[oItems[i].getCells().length - 1];

				if (oItems[i].getSelected() === true) {
					oComments.setEnabled(true);
					oComments.setPlaceholder("Enter Comments...");
				} else if (oItems[i].getSelected() === false) {
					oComments.setEnabled(false);
					oComments.setPlaceholder("");
				}
			}
		}
	});
});