# your_app/hooks_stock_entry_update.py
import frappe

def custom_on_update_stock_entry(doc, method):
    
    # Only proceed if master fields are present
    customer = doc.get("customer")
    challan_no = doc.get("customer_challan_no")

    for item in doc.get("items") or []:
        batch_no = item.batch_no
        qty = item.qty
        if batch_no:
            try:
                batch_doc = frappe.get_doc("Batch", batch_no)
                batch_doc.custom_customer = customer
                batch_doc.custom_customer_challan_no = challan_no
                batch_doc.custom_received_qty = qty
                batch_doc.save(ignore_permissions=True)
            except:
                continue

            

        
        

    
    # Optional: push updates
    # frappe.db.commit()
