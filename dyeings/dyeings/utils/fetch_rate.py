import frappe

@frappe.whitelist()
def fetch_rate(item_code, warehouse):
    """
    Return only valuation rate for the latest Stock Ledger Entry
    of a given item and warehouse.
    """

    try:
        query = """
            SELECT valuation_rate AS rate
            FROM `tabStock Ledger Entry`
            WHERE item_code = %s
              AND warehouse = %s
              AND is_cancelled = 0
            ORDER BY posting_date DESC, posting_time DESC, creation DESC
            LIMIT 1
        """
        params = (item_code, warehouse)
        result = frappe.db.sql(query, params, as_dict=True)

        if result:
            return {
                "rate": result[0].get("rate", 0)
            }
        else:
            return {
                "rate": 0
            }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Error in fetch_current_stock")
        frappe.throw(f"Failed to fetch rate: {str(e)}")
