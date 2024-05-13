frappe.ui.form.on("Quotation", {
    refresh: function (frm) {
        frm.add_custom_button(__('From Shade Process'), function () {
            new frappe.ui.form.MultiSelectDialog({
                doctype: "Shade Process",
                target: frm,
                setters: {
                    total_cost: null,
                    customer: frm.doc.party_name,
                    fabric_type: null
                },
                add_filters_group: 1,
                date_field: "transaction_date",
                columns: ["name", "total_cost", "customer", "fabric_type"],
                get_query() {
                    return {
                        filters: {docstatus: ['=', 1]}
                    };
                },
                action(selections) {
                    if (selections) {
                        frappe.call({
                            method: 'dyeings.dyeings.utils.from_shade_process.from_shade_process',
                            args: {names: selections},
                            callback: function (r) {
                                if (r.message && r.message.shade_process) {
                                    // Check for an empty row and use it if present
                                    let empty_item = frm.doc.items.find(item => !item.shade_process);
                                    r.message.shade_process.forEach(function (i) {
                                        if (empty_item) { // If empty row exists, use it
                                            frappe.model.set_value(empty_item.doctype, empty_item.name, 'shade_process', i.name);
                                            frappe.model.set_value(empty_item.doctype, empty_item.name, 'cost_rate', i.total_cost);
                                            frappe.model.set_value(empty_item.doctype, empty_item.name, 'qty', 1);
                                            frappe.model.set_value(empty_item.doctype, empty_item.name, 'fabric_type', i.fabric_type);
                                            empty_item = null; // Make sure to use the empty row only once
                                        } else {
                                            let entry = frm.add_child("items");
                                            entry.shade_process = i.name;
                                            entry.cost_rate = i.total_cost;
                                            entry.qty = 1;
                                            entry.fabric_type = i.fabric_type;
                                        }
                                    });
                                    frm.refresh_field('items');
                                }
                            }
                        });
                    }
                    this.dialog.hide();
                }
            }).show();
        }, __('Get Items From'));
    }
});

frappe.ui.form.on('Quotation Item', {
    profit_percentage: function (frm, cdt, cdn) {
        calculate_rate(frm, cdt, cdn);
    }
});

function calculate_rate(frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    frappe.model.set_value(cdt, cdn, 'rate', (flt(row.cost_rate) * (flt(row.profit_percentage) / 100)) + flt(row.cost_rate));
}
