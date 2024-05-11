frappe.ui.form.on("Quotation", {
    refresh: function (frm) {
        frm.add_custom_button(__('From Shade Process'), () => {
            // Define dialog variable
            let dialog;

            // MultiSelectDialog for individual child selection
            dialog = new frappe.ui.form.MultiSelectDialog({
                doctype: "Shade Process", target: frm, setters: {
                    total_cost: null, customer: frm.doc.party_name
                }, add_filters_group: 1, date_field: "transaction_date", columns: ["name", "total_cost", "customer"], // child item columns to be displayed
                get_query() {
                    return {
                        filters: {docstatus: ['=', 1]}
                    }
                }, action(selections) {
                    frm.clear_table('items');
                    if (selections) {

                        frappe.call({
                            method: 'dyeings.dyeings.utils.from_shade_process.from_shade_process',
                            args: {
                                names: selections // Sending list of names
                            }, callback: function (r) {
                                // Clear existing table
                                frm.clear_table('items');
                                if (r.message) {
                                    // Add items to table
                                    r.message.shade_process.forEach(function (i) {
                                        let entry = frm.add_child("items");
                                        entry.shade_process = i.name,
                                            entry.cost_rate = i.total_cost,
                                            entry.qty = 1
                                    })
                                    // Refresh field
                                    frm.refresh_field('items');
                                }
                                // Hide the dialog after action

                            }
                        });
                    }
                    // Hide the dialog after action

                }
            });

        }, __('Get Items From'));
    }
});


frappe.ui.form.on('Quotation Item', {
    profit_percentage: function (frm, cdt, cdn) {
        calcualte_rate(frm, cdt, cdn);
    }
});

function calcualte_rate(frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    frappe.model.set_value(cdt, cdn, 'rate', (flt(row.cost_rate) * (flt(row.profit_percentage) / 100)) + flt(row.cost_rate));
}