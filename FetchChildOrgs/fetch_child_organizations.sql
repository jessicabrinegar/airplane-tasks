  WITH RECURSIVE org(id) AS (
            SELECT id, parent_id, display_name, business_name, timezone_id
            FROM acm.organization
            WHERE id = :organization_id
        UNION
            SELECT o.id, o.parent_id, o.display_name, o.business_name, o.timezone_id
            FROM acm.organization o
            JOIN org ON  (o.parent_id = org.id)
  )   
            
        SELECT * FROM org;     