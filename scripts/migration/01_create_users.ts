/**
 * Step 1: Create 5 users in Supabase Auth and update profiles
 *
 * Reads J_users.csv for Glide user data. Creates users via admin API,
 * then updates profiles with display_name, role, and is_super_admin.
 * Outputs Glide ID → Supabase UUID mapping.
 */

import { supabaseAdmin, readCSV, loadMappings, saveMappings, log } from "./helpers";

// Glide user data (from J_users.csv)
const USERS = [
  {
    glide_id: "oln3M90-R.CB-GcdkYSK1w",
    name: "Juanes Necoechea",
    email: "juanesngtz@gmail.com",
    role: "Juanes",
    is_super_admin: true,
  },
  {
    glide_id: "H8EDxMJfTSGXDT-3Krqacg",
    name: "Ivonne (JENG)",
    email: "ivonnegutz@hotmail.com",
    role: "All",
    is_super_admin: false,
  },
  {
    glide_id: "AbN6.FXMRWSorXy9KxlPTQ",
    name: "Majo Mazoy",
    email: "mjmazoy@gmail.com",
    role: "All",
    is_super_admin: false,
  },
  {
    glide_id: "iDL9UFS6R0u.cR3C.szCSw",
    name: "Santiago Mazoy",
    email: "santiagomazoyr@gmail.com",
    role: "All",
    is_super_admin: false,
  },
  {
    glide_id: "hwbFC4lCTRm0pNG-FHA4Dg",
    name: "Ivonne Gutiérrez",
    email: "ivonnegutierrezgomez@gmail.com",
    role: "All",
    is_super_admin: false,
  },
];

async function findUserByEmail(email: string): Promise<string | null> {
  // Paginate through all users to find by email
  let page = 1;
  while (true) {
    const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
    if (!data?.users?.length) break;
    const found = data.users.find((u) => u.email === email);
    if (found) return found.id;
    if (data.users.length < 100) break; // last page
    page++;
  }
  return null;
}

export async function createUsers() {
  log("01", "Creating users...");
  const mappings = loadMappings();

  for (const user of USERS) {
    let userId: string | null = null;

    // Check if user already exists by email (paginated search)
    userId = await findUserByEmail(user.email);

    if (userId) {
      log("01", `  User ${user.name} already exists (${userId})`);
    } else {
      // Create user via admin API
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
        user_metadata: { display_name: user.name },
      });

      if (error) {
        console.error(`  Failed to create user ${user.name}:`, error.message);
        continue;
      }

      userId = data.user.id;
      log("01", `  Created user ${user.name} (${userId})`);
    }

    // Update profile with role and super admin flag
    const { error: profileError } = await supabaseAdmin
      .from("ft_profiles")
      .update({
        display_name: user.name,
        role: user.role,
        is_super_admin: user.is_super_admin,
      })
      .eq("id", userId);

    if (profileError) {
      console.error(`  Failed to update profile for ${user.name}:`, profileError.message);
    }

    // Store mapping
    mappings.users[user.glide_id] = userId;
  }

  saveMappings(mappings);
  log("01", `Users created. Mappings: ${Object.keys(mappings.users).length} users`);
}

// Run directly if called as main
if (require.main === module) {
  createUsers().catch(console.error);
}
