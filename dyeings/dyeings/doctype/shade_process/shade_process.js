// Copyright (c) 2024, Tech Ventures and contributors
// For license information, please see license.txt

frappe.ui.form.on('Shade Process', {
    refresh: function (frm) {
        frm.set_query("fabric", function () {
            return {
                filters: [
                    ["Item", "item_group", "=", "Fabric"]
                ]
            };
        });


        frm.set_query("service_item", function () {
            return {
                filters: [
                    ["Item", "item_group", "=", "Services"]
                ]
            };
        });

        if (frm.doc.docstatus == 1) {
            cur_frm.add_custom_button(__('New Quotation'), function () {
                    frm.trigger("new_quotation");
                },
                __('Create'))
        }

    },
    new_quotation: function (frm) {
        frappe.call({
            method: 'sayaab.dyeing.custom.new_quotation.new_quotation',
            args: {
                'source_name': frm.doc.name
            },
            callback: function (r) {
                if (!r.exc) {
                    frappe.model.sync(r.message);
                    frappe.set_route("Form", r.message.doctype, r.message.name);
                }
            }
        });
    },

});

frappe.ui.form.on('Shade Process Item', {
    qty: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        frappe.model.set_value(cdt, cdn, 'amount', row.rate * row.qty);
        total_chemical_cost(frm);
    },
    rate: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        frappe.model.set_value(cdt, cdn, 'amount', row.rate * row.qty);
        total_chemical_cost(frm);
    },
    percentage: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        frappe.model.set_value(cdt, cdn, 'qty', (row.percentage / 100) * frm.doc.fabric_qty);
        total_chemical_cost(frm);
    }
});


function total_chemical_cost(frm) {
    var amount = 0;
    var overhead_cost = 0;
    $.each(frm.doc.shade_process_item || [], function (i, d) {
        amount += flt(d.amount) || 0;
    });
    frm.set_value("chemical_cost", parseFloat(amount).toFixed(3))
    overhead_cost = frm.doc.overhead_cost || 0;
    frm.set_value("grand_total", (parseFloat(amount) + parseFloat(overhead_cost)).toFixed(3))
}

function total_overhead_cost(frm) {
    var amount = 0;
    var chemical_cost = 0;
    $.each(frm.doc.over_head_cost || [], function (i, d) {
        amount += flt(d.amount) || 0;
    });
    frm.set_value("overhead_cost", parseFloat(amount).toFixed(3))
    chemical_cost = frm.doc.chemical_cost || 0;
    frm.set_value("grand_total", (parseFloat(amount) + parseFloat(chemical_cost)).toFixed(3))
}


frappe.ui.form.on('Shade Process Account', {
    amount: function (frm, cdt, cdn) {
        total_overhead_cost(frm);
    }
});