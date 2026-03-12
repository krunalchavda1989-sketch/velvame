
CREATE OR REPLACE FUNCTION public.auto_place_binary_position()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sponsor_binary_id UUID;
  placement_parent_id UUID;
  placement_position TEXT;
  current_id UUID;
  left_child UUID;
  right_child UUID;
BEGIN
  IF NEW.referred_by IS NULL THEN
    IF NOT EXISTS (SELECT 1 FROM binary_positions WHERE binary_positions.user_id = NEW.user_id) THEN
      INSERT INTO binary_positions (user_id, profile_id, position, parent_id, sponsor_id)
      VALUES (NEW.user_id, NEW.id, 'left', NULL, NULL);
    END IF;
    RETURN NEW;
  END IF;

  SELECT bp.id INTO sponsor_binary_id
  FROM binary_positions bp
  JOIN profiles p ON p.user_id = bp.user_id
  WHERE p.id = NEW.referred_by
  LIMIT 1;

  IF sponsor_binary_id IS NULL THEN
    INSERT INTO binary_positions (user_id, profile_id, position, parent_id, sponsor_id)
    SELECT p.user_id, p.id, 'left', NULL, NULL
    FROM profiles p WHERE p.id = NEW.referred_by
    RETURNING binary_positions.id INTO sponsor_binary_id;
  END IF;

  IF sponsor_binary_id IS NULL THEN
    RETURN NEW;
  END IF;

  current_id := sponsor_binary_id;

  LOOP
    SELECT bp.id INTO left_child
    FROM binary_positions bp WHERE bp.parent_id = current_id AND bp.position = 'left'
    LIMIT 1;

    SELECT bp.id INTO right_child
    FROM binary_positions bp WHERE bp.parent_id = current_id AND bp.position = 'right'
    LIMIT 1;

    IF left_child IS NULL AND right_child IS NULL THEN
      DECLARE
        node_rec RECORD;
      BEGIN
        SELECT bp.total_left_bv + bp.carry_forward_left AS left_total,
               bp.total_right_bv + bp.carry_forward_right AS right_total
        INTO node_rec
        FROM binary_positions bp WHERE bp.id = current_id;

        IF node_rec.right_total < node_rec.left_total THEN
          placement_position := 'right';
        ELSE
          placement_position := 'left';
        END IF;
      END;
      placement_parent_id := current_id;
      EXIT;
    END IF;

    IF left_child IS NULL THEN
      placement_parent_id := current_id;
      placement_position := 'left';
      EXIT;
    END IF;

    IF right_child IS NULL THEN
      placement_parent_id := current_id;
      placement_position := 'right';
      EXIT;
    END IF;

    DECLARE
      node_rec2 RECORD;
    BEGIN
      SELECT bp.total_left_bv + bp.carry_forward_left AS left_total,
             bp.total_right_bv + bp.carry_forward_right AS right_total
      INTO node_rec2
      FROM binary_positions bp WHERE bp.id = current_id;

      IF node_rec2.right_total < node_rec2.left_total THEN
        current_id := right_child;
      ELSE
        current_id := left_child;
      END IF;
    END;
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM binary_positions WHERE binary_positions.user_id = NEW.user_id) THEN
    INSERT INTO binary_positions (user_id, profile_id, position, parent_id, sponsor_id)
    VALUES (NEW.user_id, NEW.id, placement_position, placement_parent_id, sponsor_binary_id);
  END IF;

  RETURN NEW;
END;
$function$;
