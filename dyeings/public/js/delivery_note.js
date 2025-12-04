frappe.ui.form.on("Delivery Note", {
     refresh: function (frm) {
        // Run on form load and refresh
     
    }
});

frappe.ui.form.on("Delivery Note Item", {
     qty: function (frm, cdt, cdn) {
        alert("qty changed");
        console.log("qty changed", frm, cdt, cdn);
        waste_qty_and_waste_percent(frm, cdt, cdn);
    },
    batch_no: function (frm, cdt, cdn) {
        alert("batch_no changed");
        console.log("batch_no changed", frm, cdt, cdn);
        waste_qty_and_waste_percent(frm, cdt, cdn);
    }
});



function waste_qty_and_waste_percent(frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    var waste_qty = (row.custom_qty_received || 0) - (row.qty || 0);
    frappe.model.set_value(cdt, cdn, 'custom_waste_qty', waste_qty);
    
    // Also update waste percentage if needed
    if (row.custom_qty_received > 0) {
        var waste_percent = (waste_qty / (row.custom_qty_received || 1)) * 100;
        frappe.model.set_value(cdt, cdn, 'custom_waste_percentage', waste_percent);
    }
}
