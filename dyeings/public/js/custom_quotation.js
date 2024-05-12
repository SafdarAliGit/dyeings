frappe.ui.form.on("Quotation", {
    refresh: function (frm) {
        frm.add_custom_button(__('From Shade Process'), function () {
            // MultiSelectDialog for individual child selection
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
                columns: ["name", "total_cost", "customer", "fabric_type"], // child item columns to be displayed
                get_query() {
                    return {
                        filters: {docstatus: ['=', 1]}
                    };
                },
                action(selections) {
                    if (selections) {
                        frappe.call({
                            method: 'dyeings.dyeings.utils.from_shade_process.from_shade_process',
                            args: {names: selections}, // Sending list of names
                            callback: function (r) {
                                if (r.message && r.message.shade_process) {
                                    let items = frm.doc.items || [];
                                    r.message.shade_process.forEach(function (i) {
                                        let existing_item = items.find(item => item.shade_process === i.name);
                                        if (existing_item) {
                                            existing_item.qty += 1;
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
