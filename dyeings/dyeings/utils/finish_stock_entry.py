import frappe
from frappe.utils import flt
@frappe.whitelist()
def finish_stock_entry(job_card_name):
    """Create a Material Request (Material Transfer) from Job Card Dyeing child tables"""

    # Load the Job Card Dyeing document
    job_card = frappe.get_doc("Job Card Dyeing", job_card_name)

    # check existing mr
    existing_se = frappe.db.get_value(
    "Stock Entry",
    {
        "custom_job_card_dyeing_finish": job_card.name,
        "docstatus": ("!=", 2),
        "stock_entry_type": "Repack"  
    },
    ["name"],
    as_dict=True
    )

    if existing_se:
        frappe.throw(
                f"Stock Entry {existing_se.name} already exists with type {existing_se.stock_entry_type}. "
            )
    # Create new Material Request doc
    se = frappe.new_doc("Stock Entry")
    se.stock_entry_type = "Repack"
    se.set_posting_time = 1
    se.company = job_card.company if hasattr(job_card, "company") else frappe.defaults.get_global_default("company")
    se.posting_date = job_card.date or frappe.utils.today()
    se.posting_time = frappe.utils.nowtime()
    se.custom_job_card_dyeing_finish = job_card.name

    # --- Pull items from raw_item_chamicals child table ---
    for item in job_card.raw_item_chamicals:
        se.append("items", {
            "item_code": item.item,
            "stock_uom": item.uom,
            "uom": item.uom,
            "qty": item.qty_required,
            "s_warehouse": job_card.production_warehouse
           
        })

    # --- Pull items from raw_item_dyes child table ---
    for item in job_card.raw_item_dyes:
        se.append("items", {
            "item_code": item.item,
            "stock_uom": item.uom,
            "uom": item.uom,
            "qty": item.qty,
            "s_warehouse": job_card.production_warehouse
        })

    for item in job_card.toping:
        item_toping = frappe.get_doc("Item", item.item)
        se.append("items", {
            "item_code": item.item,
            "stock_uom": item_toping.stock_uom,
            "uom": item_toping.stock_uom,
            "qty": item.qty,
            "s_warehouse": job_card.production_warehouse
        })

    
    for row in job_card.greige_fabric_detail:

        item = frappe.get_doc("Item", row.fabric_item)
        se.append("items", {
            "item_code": row.fabric_item,
            "qty": flt(row.qty_issue),
            "uom": item.stock_uom,
            "t_warehouse": job_card.finish_warehouse,
            "batch_no": row.lot,
            "use_serial_batch_fields": 1,
            "is_finished_item": 1,
            "set_basic_rate_manually": 1,
            "basic_rate": job_card.rate_per_kg,
            "basic_amount": job_card.rate_per_kg * flt(row.qty_issue),
        })

    # Insert into DB
    se.insert(ignore_permissions=True)

    # Optional: submit if required
    se.submit()

    return se.name
