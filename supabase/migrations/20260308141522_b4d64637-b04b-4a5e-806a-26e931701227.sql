
-- Function: auto-place a new user into the binary tree under their sponsor's weaker leg
-- Uses spillover: traverses down the weaker leg until finding an empty left or right slot
CREATE OR REPLACE FUNCTION public.auto_place_binary_position()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sponsor_binary_id UUID;
  placement_parent_id UUID;
  placement_position TEXT;
  current_id UUID;
  left_child UUID;
  right_child UUID;
BEGIN
  -- Skip if user has no referrer (will be root or manually placed)
  IF NEW.referred_by IS NULL THEN
    -- Create root binary position if none exists
    IF NOT EXISTS (SELECT 1 FROM binary_positions WHERE user_id = NEW.user_id) THEN
      INSERT INTO binary_positions (user_id, profile_id, position, parent_id, sponsor_id)
      VALUES (NEW.user_id, NEW.id, 'left', NULL, NULL);
    END IF;
    RETURN NEW;
  END IF;

  -- Find sponsor's binary position
  SELECT id INTO sponsor_binary_id
  FROM binary_positions bp
  JOIN profiles p ON p.user_id = bp.user_id
  WHERE p.id = NEW.referred_by
  LIMIT 1;

  -- If sponsor has no binary position, create one for them first
  IF sponsor_binary_id IS NULL THEN
    INSERT INTO binary_positions (user_id, profile_id, position, parent_id, sponsor_id)
    SELECT p.user_id, p.id, 'left', NULL, NULL
    FROM profiles p WHERE p.id = NEW.referred_by
    RETURNING id INTO sponsor_binary_id;
  END IF;

  -- If still null (shouldn't happen), bail
  IF sponsor_binary_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Start from sponsor's binary position and find placement slot
  -- Spillover algorithm: go to weaker leg, traverse down until empty slot found
  current_id := sponsor_binary_id;

  LOOP
    -- Check left child
    SELECT id INTO left_child
    FROM binary_positions WHERE parent_id = current_id AND position = 'left'
    LIMIT 1;

    -- Check right child
    SELECT id INTO right_child
    FROM binary_positions WHERE parent_id = current_id AND position = 'right'
    LIMIT 1;

    -- Both slots empty: pick weaker leg (left = weaker by default if equal)
    IF left_child IS NULL AND right_child IS NULL THEN
      -- Check which leg has less total BV
      DECLARE
        node_rec RECORD;
      BEGIN
        SELECT total_left_bv + carry_forward_left AS left_total,
               total_right_bv + carry_forward_right AS right_total
        INTO node_rec
        FROM binary_positions WHERE id = current_id;

        IF node_rec.right_total < node_rec.left_total THEN
          placement_position := 'right';
        ELSE
          placement_position := 'left';
        END IF;
      END;
      placement_parent_id := current_id;
      EXIT;
    END IF;

    -- Only left is empty
    IF left_child IS NULL THEN
      placement_parent_id := current_id;
      placement_position := 'left';
      EXIT;
    END IF;

    -- Only right is empty
    IF right_child IS NULL THEN
      placement_parent_id := current_id;
      placement_position := 'right';
      EXIT;
    END IF;

    -- Both filled: go down the weaker leg
    DECLARE
      node_rec2 RECORD;
    BEGIN
      SELECT total_left_bv + carry_forward_left AS left_total,
             total_right_bv + carry_forward_right AS right_total
      INTO node_rec2
      FROM binary_positions WHERE id = current_id;

      IF node_rec2.right_total < node_rec2.left_total THEN
        current_id := right_child;
      ELSE
        current_id := left_child;
      END IF;
    END;
  END LOOP;

  -- Insert binary position for the new user
  IF NOT EXISTS (SELECT 1 FROM binary_positions WHERE user_id = NEW.user_id) THEN
    INSERT INTO binary_positions (user_id, profile_id, position, parent_id, sponsor_id)
    VALUES (NEW.user_id, NEW.id, placement_position, placement_parent_id, sponsor_binary_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: runs after a new profile is inserted
DROP TRIGGER IF EXISTS trg_auto_place_binary ON profiles;
CREATE TRIGGER trg_auto_place_binary
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_place_binary_position();
