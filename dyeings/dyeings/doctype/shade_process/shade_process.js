// Copyright (c) 2024, Tech Ventures and contributors
// For license information, please see license.txt

frappe.ui.form.on('Shade Process', {
    refresh: function (frm) {
            frm.set_query('item', 'shade_process_item', function (doc, cdt, cdn) {
            var d = locals[cdt][cdn];
            return {
                filters: [
                    ["Item", "item_group", "in", ["Dyes", "Chemicals"]]
                ]
            };
        }),
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
    ref_shade_no: function (frm) {
        if (frm.doc.ref_shade_no) {
            var ref_shade_no = frm.doc.ref_shade_no;
            frm.clear_table('dyeing_overhead_items');
            me.frm.call({
                method: "dyeings.dyeings.utils.fetch_dying_process_items.fetch_dying_process_items",
                args: {
                    ref_shade_no: ref_shade_no
                },
                callback: function (r, rt) {

                    if (r.message.dyeing_process_items) {
                        r.message.dyeing_process_items.forEach(function (i) {
                            let entry = frm.add_child("dyeing_overhead_items");
                            entry.dyeing_process = i.dyeing_process,
                                entry.overhead_account = i.overhead_account,
                                entry.amount = i.amount
                        });
                    }
                    frm.refresh_field('dyeing_overhead_items');
                    total_dyeing_overhead_items_amount(frm);
                }
            });
        }
    }

});

frappe.ui.form.on('Shade Process Item', {
    qty: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        frappe.model.set_value(cdt, cdn, 'amount', row.rate * row.qty);
        total_shade_process_item_amount(frm);
    },
    rate: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        frappe.model.set_value(cdt, cdn, 'amount', row.rate * row.qty);
        total_shade_process_item_amount(frm);
    },
    percentage: function (frm, cdt, cdn) {
        shade_process_item_qty(frm, cdt, cdn);
    }
});

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

function total_shade_process_item_amount(frm) {
    frm.doc.total_shade_process_item_amount = 0;
    var spi = frm.doc.shade_process_item;
    for (var i in spi) {
        frm.doc.total_shade_process_item_amount += flt(spi[i].amount) || 0
    }
    frm.refresh_field("total_shade_process_item_amount");
}

function total_dyeing_overhead_items_amount(frm) {
    frm.doc.total_dyeing_overhead_items_amount = 0;
    var doi = frm.doc.dyeing_overhead_items;
    for (var i in doi) {
        frm.doc.total_dyeing_overhead_items_amount += flt(doi[i].amount) || 0
    }
    frm.refresh_field("total_dyeing_overhead_items_amount");
    frm.set_value("total_cost", flt(frm.doc.total_shade_process_item_amount) + flt(frm.doc.total_dyeing_overhead_items_amount));
}
function shade_process_item_qty(frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    var fabric_sample_qty = frm.doc.fabric_sample_qty || 0;
    frappe.model.set_value(cdt, cdn, 'qty', flt(fabric_sample_qty) * (flt(row.percentage) / 100));
    total_shade_process_item_amount(frm);
}