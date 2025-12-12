frappe.ui.form.on("Delivery Note", {
    refresh(frm) {
        // Runs on form load/refresh
    }
});

frappe.ui.form.on("Delivery Note Item", {

    qty(frm, cdt, cdn) {
        waste_qty_and_waste_percent(frm, cdt, cdn);
    },

    batch_no(frm, cdt, cdn) {
        waste_qty_and_waste_percent(frm, cdt, cdn);
    }


});


function waste_qty_and_waste_percent(frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    // Safely convert to numbers
    let received_qty = flt(row.custom_qty_received);
    let qty = flt(row.qty);
    // Calculate waste qty
    let waste_qty = received_qty - qty;
    frappe.model.set_value(cdt, cdn, "custom_waste_qty", waste_qty);

    // Calculate waste percentage
    let waste_percentage = 0;
    if (received_qty > 0) {
        waste_percentage = (waste_qty / received_qty) * 100;
    }

    frappe.model.set_value(cdt, cdn, "custom_wastage_percent", flt(waste_percentage, 2));
}
