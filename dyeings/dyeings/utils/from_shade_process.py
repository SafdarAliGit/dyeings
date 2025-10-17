import json
import frappe

@frappe.whitelist()
def from_shade_process(**args):
    names = args.get('names')
    if not names:
        return {"shade_process": []}

    # names is a JSON string, e.g. '["SP-001", "SP-002"]'
    try:
        name_list = json.loads(names)
    except Exception as e:
        frappe.throw(f"Invalid names parameter: {e}")

    # Get the shade process records
    dpi_query = frappe.get_all(
        "Shade Process",
        filters = {
            "docstatus": 1,
            "name": ["in", name_list]
        },
        fields = ["name", "total_cost", "fabric_type", "service_item", "finish_item", "color", "finish_type"]
    )

    # If nothing, return empty
    if not dpi_query:
        return {"shade_process": []}

    # For each shade process record, attempt to fetch corresponding Item
    for rec in dpi_query:
        fabric_type = rec.get("fabric_type")
        if fabric_type:
            # Try to fetch the Item doc (assuming fabric_type is item_code)
            item = frappe.db.get_value("Item",
                                       fabric_type,
                                       ["item_name", "stock_uom"],
                                       as_dict=True)
            if item:
                rec["item_name"] = item.item_name
                rec["stock_uom"] = item.stock_uom
            else:
                # If no matching Item found, set empty or default
                rec["item_name"] = None
                rec["stock_uom"] = None
        else:
            rec["item_name"] = None
            rec["stock_uom"] = None

    return {"shade_process": dpi_query}
