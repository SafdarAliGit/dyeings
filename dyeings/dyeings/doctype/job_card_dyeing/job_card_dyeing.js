frappe.ui.form.on('Job Card Dyeing', {
    refresh: function(frm) {
		frm.add_custom_button(__('Fabric Issue'), function () {
            fabric_issue(frm);
        }).removeClass("btn-default").addClass("btn btn-xs btn-yellow");

		frm.add_custom_button(__('Request Raw Material'), function () {
            frm.trigger("request_rm");
        }).removeClass("btn-default").addClass("btn btn-xs btn-peach");

		frm.add_custom_button(__('Job Start'), function () {
            frm.trigger("job_start");
        }).removeClass("btn-default").addClass("btn btn-xs btn-blue");

		frm.add_custom_button(__('Job End'), function () {
            frm.trigger("job_end");
        }).removeClass("btn-default").addClass("btn btn-xs btn-orange");

		frm.add_custom_button(__('Finish'), function () {
            frm.trigger("finish_job");
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
                    "item": row.fabric_item
                }
            };
        });
    },
	shade_process_no:function(frm){
		fetch_chemicals_and_dyes(frm);
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
            }
        }
    });
}

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
