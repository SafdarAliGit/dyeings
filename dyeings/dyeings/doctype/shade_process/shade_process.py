from dyeings.dyeings.doctype.utils_functions import get_doctype_by_field
from frappe.model.document import Document
import frappe
from frappe.model.naming import make_autoname


class ShadeProcess(Document):
    def before_save(self):
        self.finish_item = f"{self.fabric_type} - {self.name}"

    def on_submit(self):
        product_item = frappe.new_doc("Item")
        product_item.item_code = self.finish_item
        product_item.item_name = self.finish_item
        product_item.item_group = 'Products'
        product_item.stock_uom = 'Nos'
        product_item.is_stock_item = 1
        product_item.ref_no = self.name
        product_item.ref_doctype = "Shade Process"
        try:
            product_item.save()
        except Exception as e:
            frappe.throw(frappe._("Error saving Item: {0}".format(str(e))))

        bom = frappe.new_doc("BOM")
        bom.item = self.finish_item
        bom.quantity = self.fabric_sample_qty
        bom.ref_no = self.name
        bom.ref_doctype = "Shade Process"
        for i in self.shade_process_item:
            bom.append("items", {
                "item_code": i.item,
                "qty": i.qty,
                "uom": i.uom,
                "rate": i.rate,
                "amount": i.amount
            })

        try:
            bom.save()
            # bom.submit()
        except Exception as e:
            frappe.log_error(f"Error occurred during BOM submission: {e}")

    def on_cancel(self):
        bom_entry = get_doctype_by_field('BOM', 'ref_no', self.name)
        if bom_entry.docstatus != 2:  # Ensure the document is in the "Submitted" state
            bom_entry.cancel()
            frappe.db.commit()
        else:
            frappe.throw("Document is not in the 'Submitted' state.")
        if bom_entry.amended_from:
            new_name = int(bom_entry.name.split("-")[-1]) + 1
        else:
            new_name = f"{bom_entry.name}-{1}"
        make_autoname(new_name, 'BOM')
