#!/usr/bin/env python3
"""
Reversible MongoDB migration script for Nagaland State Materials.
Inspects, backups, and retags legacy 'History, Heritage & Sites' materials into
authoritative canonical categories: History, Heritage & Sites, Art & Culture.
"""
import sys
import os
import json
from datetime import datetime
import pymongo

def get_mongo_client():
    uri = os.environ.get("MONGO_URI") or os.environ.get("SPRING_DATA_MONGODB_URI") or "mongodb://localhost:27017/bodhganga"
    return pymongo.MongoClient(uri), uri

def run_migration(dry_run=True):
    client, uri = get_mongo_client()
    db = client.get_default_database() or client["bodhganga"]
    products_col = db["products"]

    print(f"[{'DRY-RUN' if dry_run else 'APPLY'}] Connecting to {uri.split('@')[-1]}")

    nagaland_docs = list(products_col.find({"stateSlug": "nagaland"}))
    print(f"Found {len(nagaland_docs)} products for state 'nagaland'.")

    # 1. Safe Backup of records before modification
    backup_file = f"backup_nagaland_products_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(backup_file, "w", encoding="utf-8") as f:
        json.dump([dict(d, _id=str(d["_id"]), createdAt=str(d.get("createdAt")), updatedAt=str(d.get("updatedAt"))) for d in nagaland_docs], f, indent=2)
    print(f"Safe backup written to {backup_file}")

    updated_count = 0
    history_count = 0
    heritage_count = 0
    art_count = 0

    for doc in nagaland_docs:
        doc_id = doc["_id"]
        title = doc.get("title") or doc.get("displayTitle") or ""
        cat = doc.get("category") or ""
        dist_slug = doc.get("districtSlug") or "general"

        new_category = None
        new_category_slug = None
        new_section_slug = None

        if "Battle of Kohima" in title or "Naga Hills District" in title or "Dimasa Kachari Kingdom" in title:
            new_category = "History"
            new_category_slug = "history"
            new_section_slug = "history"
            history_count += 1
        elif "Ruins of Kachari Rajbari" in title:
            new_category = "Heritage & Sites"
            new_category_slug = "heritage-sites"
            new_section_slug = "heritage-sites"
            heritage_count += 1
        elif "Art" in cat or "Culture" in cat or "Festival" in title or "Dance" in title:
            new_category = "Art & Culture"
            new_category_slug = "art-culture"
            new_section_slug = "art-culture"
            art_count += 1

        if new_category:
            update_fields = {
                "category": new_category,
                "categorySlug": new_category_slug,
                "sectionSlug": new_section_slug,
                "districtSlug": "general",
                "district": "general",
                "resourceScope": "STATE",
                "contentArea": "STATE_CONTENT",
                "isFree": True,
                "price": 0.0,
                "isPublished": True,
                "published": True,
                "archived": False,
                "isDeleted": False,
                "updatedAt": datetime.now()
            }
            print(f"  -> {'[WOULD UPDATE]' if dry_run else '[UPDATED]'} {title} => {new_category} (Scope: STATE, District: general)")
            if not dry_run:
                products_col.update_one({"_id": doc_id}, {"$set": update_fields})
            updated_count += 1

    print("\n=== MIGRATION SUMMARY ===")
    print(f"Total Nagaland Docs Scanned: {len(nagaland_docs)}")
    print(f"Total Retagged: {updated_count}")
    print(f"  - History: {history_count}")
    print(f"  - Heritage & Sites: {heritage_count}")
    print(f"  - Art & Culture: {art_count}")
    print(f"Status: {'SIMULATION ONLY (run with --apply to commit)' if dry_run else 'SUCCESSFULLY APPLIED'}")

if __name__ == "__main__":
    apply_mode = "--apply" in sys.argv
    run_migration(dry_run=not apply_mode)
