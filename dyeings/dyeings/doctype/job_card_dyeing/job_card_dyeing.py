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
		
		if self.raw_item_chamicals:
			for row in self.raw_item_chamicals:
				total_amount_chemicals += row.amount
		if self.raw_item_dyes:
			for row in self.raw_item_dyes:
				total_amount_dyes += row.amount
		if self.toping:
			for row in self.toping:
				total_amount_toping += row.amount	
		
		self.total_amount = total_amount_chemicals + total_amount_dyes + total_amount_toping
		self.rate_per_kg = self.total_amount / self.qty_total
		