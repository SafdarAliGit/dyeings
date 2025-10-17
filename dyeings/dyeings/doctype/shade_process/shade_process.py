from dyeings.dyeings.doctype.utils_functions import get_doctype_by_field
from frappe.model.document import Document
import frappe
from frappe.model.naming import make_autoname


class ShadeProcess(Document):
    # def before_save(self):
    #     self.finish_item = f"{self.fabric_type} - {self.name}"

    def on_submit(self):
        # product_item = frappe.new_doc("Item")
        # product_item.item_code = self.finish_item
        # product_item.item_name = self.finish_item
        # product_item.item_group = 'Products'
        # product_item.stock_uom = 'Kg'
        # product_item.is_stock_item = 1
        # product_item.ref_no = self.name
        # product_item.ref_doctype = "Shade Process"
        # try:
        #     product_item.save()
        # except Exception as e:
        #     frappe.throw(frappe._("Error saving Item: {0}".format(str(e))))

        bom = frappe.new_doc("BOM")
        bom.item = self.finish_item
        bom.quantity = self.fabric_sample_qty
        bom.ref_no = self.name
        bom.ref_doctype = "Shade Process"
        if len(self.process_overhead_items) > 0:
            bom.with_operations = 1
        for i in self.shade_process_chemicals_item:
            bom.append("items", {
                "item_code": i.item,
                "qty": i.qty,
                "uom": i.uom,
                "rate": i.rate,
                "amount": i.amount
            })
        for i in self.shade_process_dyes_item:
            bom.append("items", {
                "item_code": i.item,
                "qty": i.qty,
                "uom": i.uom,
                "rate": i.rate,
                "amount": i.amount
            })
        if len(self.process_overhead_items) > 0:
            for j in self.process_overhead_items:
                bom.append("operations", {
                    "operation": j.dyeing_process,
                    "time_in_mins": j.estimated_operation_time
                })

        try:
            bom.save()
            # bom.submit()
        except Exception as e:
            frappe.log_error(f"Error occurred during BOM submission: {e}")

    def on_cancel(self):
        try:
            # Fetch the BOM entry based on the reference number
            bom_entry = get_doctype_by_field('BOM', 'ref_no', self.name)

            if bom_entry:
                if bom_entry.docstatus == 0:
                    # Delete the BOM entry if its docstatus is 0
                    bom_entry.delete()
                    frappe.db.commit()
                    # Show success message for deletion
                    frappe.msgprint("BOM entry deleted successfully.")

                elif bom_entry.docstatus == 1:
                    # Cancel the BOM entry if its docstatus is 1
                    bom_entry.cancel()
                    frappe.db.commit()

                    # Determine the new name based on whether the BOM entry is amended
                    if bom_entry.amended_from:
                        new_name = int(bom_entry.name.split("-")[-1]) + 1
                    else:
                        new_name = f"{bom_entry.name}-{1}"

                    # Create a new BOM entry with the new name
                    make_autoname(new_name, 'BOM')

                    # Show success message for cancellation
                    frappe.msgprint("BOM entry cancelled successfully.")

                else:
                    # Show error message if the BOM entry is neither in the "Draft" nor "Submitted" state
                    frappe.msgprint("Document is not in a cancellable or deletable state.")

            else:
                # Show error message if the BOM entry does not exist
                frappe.msgprint("BOM entry does not exist.")

        except Exception as e:
            # Handle any other errors and show an error message
            frappe.throw(f"An error occurred: {str(e)}")



