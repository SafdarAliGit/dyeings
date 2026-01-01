import frappe
from frappe.utils import flt
@frappe.whitelist()
def finish_stock_entry(job_card_name):
    """Create a Material Request (Material Transfer) from Job Card Dyeing child tables"""

    # Load the Job Card Dyeing document
    job_card = frappe.get_doc("Job Card Dyeing", job_card_name)

    if job_card.reprocess == 1 and job_card.reason_for_reprocess == "Mechanical Finish":
        # check existing mr
        existing_se = frappe.db.get_value(
        "Stock Entry",
        {
            "custom_job_card_dyeing_finish": job_card.name,
            "docstatus": ("!=", 2),
            "stock_entry_type": "Material Transfer"  
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
        se.stock_entry_type = "Material Transfer"
        se.set_posting_time = 1
        se.company = job_card.company if hasattr(job_card, "company") else frappe.defaults.get_global_default("company")
        se.posting_date = frappe.utils.today()
        se.posting_time = frappe.utils.nowtime()
        se.custom_job_card_dyeing_finish = job_card.name

        for row in job_card.greige_fabric_detail:

            item = frappe.get_doc("Item", row.fabric_item)
            se.append("items", {
                "item_code": row.fabric_item,
                "qty": flt(row.qty_issue),
                "uom": item.stock_uom,
                "t_warehouse": job_card.finish_warehouse,
                "s_warehouse": job_card.production_warehouse,
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
        frappe.set_value("Job Card Dyeing", job_card_name, "finish", se.name)
        return {"stock_entry": se.name}

    else:   

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
        se.posting_date = frappe.utils.today()
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
        frappe.set_value("Job Card Dyeing", job_card_name, "finish", se.name)

        # Fabric Consumptions
        fc = frappe.db.get_value(
        "Stock Entry",
        {
            "custom_job_card_dyeing_consumption": job_card.name,
            "docstatus": ("!=", 2),
            "stock_entry_type": "Fabric Consumption"  
        },
        ["name"],
        as_dict=True
        )

        if fc:
            frappe.throw(
                    f"Stock Entry {fc.name} already exists with type {fc.stock_entry_type}. "
                )
        # Create new Material Request doc
        fcse = frappe.new_doc("Stock Entry")
        fcse.stock_entry_type = "Fabric Consumption"
        fcse.set_posting_time = 1
        fcse.company = job_card.company if hasattr(job_card, "company") else frappe.defaults.get_global_default("company")
        fcse.posting_date = frappe.utils.today()
        fcse.posting_time = frappe.utils.nowtime()
        fcse.custom_job_card_dyeing_consumption = job_card.name
        fcse.from_warehouse = job_card.production_warehouse
        for row in job_card.greige_fabric_detail:

            item = frappe.get_doc("Item", row.fabric_item)
            fcse.append("items", {
                "item_code": row.fabric_item,
                "qty": flt(row.qty_issue),
                "uom": item.stock_uom,
                "batch_no": row.lot,
                "use_serial_batch_fields": 1,
                "allow_zero_valuation_rate": 1
            })
        fcse.submit()
        frappe.set_value("Job Card Dyeing", job_card_name, "consumption", fcse.name)
        return {"stock_entry": se.name, "fabric_consumption": fcse.name}
