# Copyright (c) 2025, Techventures and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
class JobCardDyeing(Document):
    def validate(self):
        self.calculate_totals()
    
    def calculate_totals(self):
        total_amount_chemicals = 0
        total_amount_dyes = 0
        total_amount_toping = 0

        # Sum chemicals
        for row in (self.raw_item_chamicals or []):
            total_amount_chemicals += (row.amount or 0)

        # Sum dyes
        for row in (self.raw_item_dyes or []):
            total_amount_dyes += (row.amount or 0)

        # Sum topping
        for row in (self.toping or []):
            total_amount_toping += (row.amount or 0)

        # Total amount
        self.total_amount = (
            total_amount_chemicals 
            + total_amount_dyes 
            + total_amount_toping
        )

        # Rate per kg (safe division)
        if self.qty_total and self.qty_total != 0:
            self.rate_per_kg = self.total_amount / self.qty_total
        else:
            self.rate_per_kg = 0

		