frappe.ui.form.on('Job Card Dyeing', {
    refresh: function(frm) {
		frm.add_custom_button(__('Fabric Issue'), function () {
            fabric_issue(frm);
        }).removeClass("btn-default").addClass("btn btn-xs btn-yellow");

		frm.add_custom_button(__('Request Chemicals'), function () {
            create_material_request_chemicals(frm);
        }).removeClass("btn-default").addClass("btn btn-xs btn-peach").css("background-color", "#f36876ff");

        frm.add_custom_button(__('Request Dyes'), function () {
            create_material_request_dyes(frm);
        }).removeClass("btn-default").addClass("btn btn-xs btn-peach");

		frm.add_custom_button(__('Job Start'), function () {
            frm.trigger("job_start");
        }).removeClass("btn-default").addClass("btn btn-xs btn-blue");

		frm.add_custom_button(__('Job End'), function () {
            frm.trigger("job_end");
        }).removeClass("btn-default").addClass("btn btn-xs btn-orange");

		frm.add_custom_button(__('Finish'), function () {
            create_finish_stock_entry(frm);
        }).removeClass("btn-default").addClass("btn btn-xs btn-green");

        frm.set_query("fabric_item", "greige_fabric_detail", function () {
            return {
                filters: {
                    "item_group": "Fabric"
                }
            };
        });
        frm.set_query("lot", "greige_fabric_detail", function (doc, cdt, cdn) {
            let row = locals[cdt][cdn];
            return {
                filters: {
                    "custom_customer": frm.doc.party_name
                }
            };
        });
       frm.set_query("item", "toping", function (doc, cdt, cdn) {
            return {
                filters: [
                    ["Item", "item_group", "in", ["Dyes", "Chemicals"]]
                ]
            };
        });

        frm.set_query("item", "raw_item_chamicals", function (doc, cdt, cdn) {

            return {
                filters: {
                    "item_group": "Chemicals"
                }
            };
            });

            frm.set_query("item", "raw_item_dyes", function (doc, cdt, cdn) {
                  return {
                filters: {
                    "item_group": "Dyes"
                }
            };
            });


        frm.set_query("shade_process_no", function () {
            return {
                filters: [
                    ["customer", "=", frm.doc.party_name],
                    ["color", "=", frm.doc.color],
                    ["docstatus", "=", 1]
                ]
            };
        });
    },
	shade_process_no:function(frm){
		fetch_chemicals_and_dyes(frm);
	},
    operation:function(frm){
		fetch_sub_operations(frm);
	}
});

frappe.ui.form.on('Greige Fabric Detail', {
	qty_issue: function(frm, cdt, cdn) {
	  calculate_totals(frm, cdt, cdn, "total_fabric_issue","greige_fabric_detail", "qty_issue", 4);
	},
	lot:function(frm, cdt, cdn){
		calculate_totals(frm, cdt, cdn, "qty_total","greige_fabric_detail", "qty_available", 4);
	}
  });
  
  frappe.ui.form.on('Raw Item Chamicals', {
	percentage: function(frm, cdt, cdn) {
        apply_percentage_on_chemicals(frm, cdt, cdn);
	}
  });

  frappe.ui.form.on('Raw Item Dyes', {
	percentage: function(frm, cdt, cdn) {
        apply_percentage_on_dyes(frm, cdt, cdn);
        calculate_dyes_total(frm);
	}
  });
   frappe.ui.form.on('Raw Item Dyes', {
	qty: function(frm, cdt, cdn) {
        calculate_toping_total(frm);
	},
    rate:function(frm, cdt, cdn){
        calculate_toping_total(frm);
    }
  });

  function calculate_totals(frm, cdt, cdn, field_to_set,child_table_fieldname, fieldname, precision = 4) {
	const row = locals[cdt][cdn];
	let total = 0;
  
	// Loop across child table rows in frm.doc
	(frm.doc[child_table_fieldname] || []).forEach(item => {
	  total += flt(item[fieldname] || 0);
	});
  
	frm.set_value(field_to_set, total.toFixed(precision));
  }
  

  
  function fetch_chemicals_and_dyes(frm) {

    
    frappe.call({
        method: "dyeings.dyeings.utils.fetch_chemicals_and_dyes.fetch_chemicals_and_dyes",
        args: { shade_process_no: frm.doc.shade_process_no },
        callback: function(response) {
            if (response.exc) {
                console.error("Server error:", response.exc);
                return;
            }
            
            const data = response.message || {};
            const chemicals = data.chemicals || [];
            const dyes = data.dyes || [];

			console.log("Chemicals:", chemicals);
			console.log("Dyes:", dyes);
            
            // Populate tables only if they exist
            if (frm.fields_dict['raw_item_chamicals']) {
                frm.clear_table("raw_item_chamicals");
                chemicals.forEach(item => {
                    const row = frm.add_child("raw_item_chamicals");
                    Object.assign(row, {
                        item: item.item,
                        percentage: item.percentage,
                        uom: item.uom,
                        qty_per_kg: item.qty,
                        rate: item.rate,
						qty_required: item.qty * frm.doc.total_fabric_issue || 0,
                        amount: item.rate * item.qty * frm.doc.total_fabric_issue || 0
                    });
                });
                frm.refresh_field("raw_item_chamicals");
                calculate_chemicals_total(frm);
            }
            
            if (frm.fields_dict['raw_item_dyes']) {
                frm.clear_table("raw_item_dyes");
                dyes.forEach(item => {
                    const row = frm.add_child("raw_item_dyes");
                    Object.assign(row, {
                        item: item.item,
                        percentage: item.percentage,
                        uom: item.uom,
                        qty_per_kg: item.qty,
                        qty: item.qty * frm.doc.total_fabric_issue || 0,
                        rate: item.rate,
                        amount: item.rate * item.qty * frm.doc.total_fabric_issue || 0
                    });
                });
                frm.refresh_field("raw_item_dyes");
                calculate_dyes_total(frm)
            }
        }
    });
}
frappe.ui.form.on("Toping", {
    material_request: function() {}, // keep empty

    create_material_request: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        frm.call({
            method: "create_material_request_row",
            doc: frm.doc,
            args: {
                row_name: cdn
            },
            callback(r) {
                frm.reload_doc();
            }
        });
    },

  item: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        if (!row.item || !frm.doc.chemicals_store) {
            return;
        }

        // Call server function to get rate
        frappe.call({
            method: "dyeings.dyeings.utils.fetch_rate.fetch_rate",   // CHANGE PATH
            args: {
                item_code: row.item,
                warehouse: frm.doc.chemicals_store
            },
            callback: function (r) {
                if (r && r.message) {
                    let rate = r.message.rate || 0;

                    frappe.model.set_value(cdt, cdn, "rate", rate);

                    // Calculate amount
                    let amt = (row.qty || 0) * rate;
                    frappe.model.set_value(cdt, cdn, "amount", amt);
                }
            }
        });
    },
    qty:function(frm, cdt, cdn){
        let row = locals[cdt][cdn];
        let amount = row.qty * row.rate;
        frappe.model.set_value(cdt, cdn, "amount", amount);
    }
});



function fabric_issue(frm){
    // if (frm.doc.docstatus === 1) {  // Only after submit
     
            frappe.call({
                method: "dyeings.dyeings.utils.create_material_issue.create_material_issue",
                args: {
                    docname: frm.doc.name
                },
                callback: function(r) {
                    if (!r.exc) {
                        frappe.msgprint(__('Stock Entry {0} created successfully', [r.message]));
                    }
                }
            });
       
    // }
}

function create_material_request_chemicals(frm){
frappe.call({
    method: "dyeings.dyeings.utils.create_material_request.create_material_request_chemicals",
    args: {
        job_card_name: frm.doc.name
    },
    callback: function(r) {
        if (!r.exc) {
            frappe.msgprint({
                title: __('Success'),
                message: __('Material Request created: <b>' + r.message + '</b>'),
                indicator: 'green'
            });
            
        }
    }
});
}

function create_material_request_dyes(frm){
frappe.call({
    method: "dyeings.dyeings.utils.create_material_request.create_material_request_dyes",
    args: {
        job_card_name: frm.doc.name
    },
    callback: function(r) {
        if (!r.exc) {
            frappe.msgprint({
                title: __('Success'),
                message: __('Material Request created: <b>' + r.message + '</b>'),
                indicator: 'green'
            });
            
        }
    }
});
}

function create_finish_stock_entry(frm){
    frappe.call({
        method: "dyeings.dyeings.utils.finish_stock_entry.finish_stock_entry",
        args: {
            job_card_name: frm.doc.name
        },
        callback: function(r) {
            if (!r.exc) {
                frappe.msgprint({
                    title: __('Success'),
                    message: __('Stock Entry created: <b>' + r.message + '</b>'),
                    indicator: 'green'
                });
                
            }
        }
    });
    }

function apply_percentage_on_chemicals(frm, cdt, cdn){
    var row = locals[cdt][cdn];
    var percentage = row.percentage;
    var qty_per_kg = 1000 * (flt(percentage) / 100) / 1000;
    frappe.model.set_value(cdt, cdn, 'qty_per_kg', qty_per_kg);
    frappe.model.set_value(cdt, cdn, 'qty_required', flt(qty_per_kg) * flt(frm.doc.total_fabric_issue));
    frappe.model.set_value(cdt, cdn, 'amount', row.rate * flt(row.qty_required));
}

function apply_percentage_on_dyes(frm, cdt, cdn){
    var row = locals[cdt][cdn];
    var percentage = row.percentage;
    var qty_per_kg = 1000 * (flt(percentage) / 100) / 1000;
    frappe.model.set_value(cdt, cdn, 'qty_per_kg', qty_per_kg);
    frappe.model.set_value(cdt, cdn, 'qty', flt(qty_per_kg) * flt(frm.doc.total_fabric_issue));
    frappe.model.set_value(cdt, cdn, 'amount', row.rate * flt(row.qty));
}

function fetch_sub_operations(frm){
    const operation = frm.doc.operation;
    if (!operation) return;

    frappe.call({
        method: "dyeings.dyeings.utils.fetch_sub_operations.fetch_sub_operations",
        args: { 
            operation: operation 
        },
        callback: function(r) {
            if (r.message && r.message.operations) {
                frm.clear_table("operation_route");
                r.message.operations.forEach(row => {
                    let child = frm.add_child('operation_route');
                    child.operation = row.operation;
                });
                
                frm.refresh_field("operation_route");
            }
        }
    });
}


function calculate_chemicals_total(frm) {
    let total = 0;

    (frm.doc.raw_item_chamicals || []).forEach(row => {
        total += flt(row.amount);
    });

    frm.set_value("total_chemicals_amount", total);
}

function calculate_dyes_total(frm) {
    let total = 0;

    (frm.doc.raw_item_dyes || []).forEach(row => {
        total += flt(row.amount);
    });

    frm.set_value("total_dyes_amount", total);
}
function calculate_toping_total(frm) {
    let total = 0;

    (frm.doc.toping || []).forEach(row => {
        total += flt(row.amount);
    });

    frm.set_value("total_toping_amount", total);
}