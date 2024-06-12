from __future__ import unicode_literals

import frappe


@frappe.whitelist()
def new_quotation(source_name):
    source_name = frappe.get_doc("Shade Process", source_name)
    doc = frappe.new_doc("Quotation")

    doc.shade_process_id = source_name.name
    doc.party_name = source_name.customer
    item = doc.append("items", {})
    item.item_code = source_name.service_item

    return doc
