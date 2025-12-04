frappe.ui.form.on("Delivery Note", {
    refresh(frm) {
        // Runs on load and refresh
    }
});

frappe.ui.form.on("Delivery Note Item", {
    qty(frm, cdt, cdn) {
        console.log("qty changed");
        waste_qty_and_waste_percent(frm, cdt, cdn);
    },
    batch_no(frm, cdt, cdn) {
        console.log("batch_no changed");
        waste_qty_and_waste_percent(frm, cdt, cdn);
    }
});


function waste_qty_and_waste_percent(frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    // Convert safely to numbers
    let received_qty = Number(row.custom_qty_received) || 0;
    let qty = Number(row.qty) || 0;

    // Calculate waste qty
    let waste_qty = received_qty - qty;

    frappe.model.set_value(cdt, cdn, "custom_waste_qty", waste_qty);

    // Calculate waste percentage
    if (received_qty > 0) {
        let waste_percent = (waste_qty / received_qty) * 100;
        frappe.model.set_value(cdt, cdn, "custom_waste_percentage", waste_percent);
    } else {
        frappe.model.set_value(cdt, cdn, "custom_waste_percentage", 0);
    }
}
