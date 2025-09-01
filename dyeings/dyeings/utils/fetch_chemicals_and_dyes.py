import frappe

@frappe.whitelist()
def fetch_chemicals_and_dyes(shade_process_no):
    if not shade_process_no:
        return {"chemicals": [], "dyes": []}

    chemicals = frappe.get_all(
        "Shade Process Chemicals Item",
        filters={
            "parent": shade_process_no
        },
        fields=["seq_no", "item", "percentage", "uom", "qty", "rate", "amount"],
        order_by="idx"
    )

    dyes = frappe.get_all(
        "Shade Process Dyes Item",
        filters={
            "parent": shade_process_no
        },
        fields=["seq_no", "item", "percentage", "uom", "qty", "rate", "amount"],
        order_by="idx"
    )

    return {
        "chemicals": chemicals,
        "dyes": dyes
    }
