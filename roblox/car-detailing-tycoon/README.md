# Car Detailing Tycoon — Roblox scripts

Three scripts that build and run the whole game. Nothing else is needed: the
server builds the town, the plots, the Hardware Supply Store, the Caddy vans and
the customer cars in code, so it runs from an empty Baseplate.

> This folder is separate from the Kaiku website in the rest of this repository.
> Nothing in the site reads it, and it is excluded from Vercel deploys. Keep it
> on this branch or move it to its own repository; don't merge it into `main`.

| File                              | Studio type | Goes in                                        |
| --------------------------------- | ----------- | ---------------------------------------------- |
| `GameServer.server.luau`          | Script      | `ServerScriptService`                          |
| `GameClient.client.luau`          | LocalScript | `StarterPlayer` → `StarterPlayerScripts`       |
| `InterfaceController.client.luau` | LocalScript | `StarterGui` → a ScreenGui named `DetailingUI` |

The `.server.luau` / `.client.luau` endings are the Rojo naming convention, so
the files also work with Rojo or with Claude through the Roblox Studio MCP
bridge.

## Put it in Studio

1. Open Roblox Studio and create a new **Baseplate** place.
2. In **Explorer**, right-click **ServerScriptService** → **Insert Object** →
   **Script**. Rename it `GameServer`, delete the default line, and paste in the
   whole of `GameServer.server.luau`.
3. Expand **StarterPlayer**, right-click **StarterPlayerScripts** → **Insert
   Object** → **LocalScript**. Rename it `GameClient` and paste in
   `GameClient.client.luau`.
4. Right-click **StarterGui** → **Insert Object** → **ScreenGui**. Rename it
   `DetailingUI`, and in **Properties** untick **ResetOnSpawn**.
5. Right-click `DetailingUI` → **Insert Object** → **LocalScript**. Rename it
   `InterfaceController` and paste in `InterfaceController.client.luau`.
6. Press **Play**. The Output window should print
   `[GameServer] Car Detailing Tycoon ready: 6 plots, profile store MOCK (in-memory).`

You don't need to create `ReplicatedStorage.NetworkEvents` or any RemoteEvents.
The server creates any that are missing, and it reuses them if you've already
made them.

## Make saving work

In a new place the game saves to an in-memory store, which is wiped when you
stop. To save for real:

1. **File** → **Publish to Roblox**.
2. **Home** → **Game Settings** → **Security** → switch on **Enable Studio
   Access to API Services** → **Save**.
3. Press **Play** again. The Output line should now say `profile store LIVE`.

## Server size

There are 6 plots, so set the server size to **6**: Creator Dashboard → your
experience → **Places** → the place → **Settings** → **Server Size**. A 7th
player would be told the server is full. For more players, raise
`CONFIG.PlotCount` at the top of `GameServer`. Plots are 140 studs apart along
the main road.

## Play-test the whole loop in about five minutes

1. A camera fly-over plays. Get in the white Caddy van (walk into the driver's
   seat) and follow the green arrow to the **Hardware Supply Store**.
2. Park in the car park, get out (Space), and hold **E** on the red button for
   the **Starter Detailing Kit**.
3. Drive back to your plot. The naming window opens: type a company name. It
   appears on your entrance sign and as a wrap on both sides of the van.
4. The phone slides in. Tap **Launch £5** on **Leaflet Drop**.
5. A customer's car drives into the wash bay. Equip the **High-Pressure
   Washer** (key 1) and click or tap the brown mud. Each hit adds £25 to the
   "Current Bill" above the roof, and every fourth hit on a patch clears it.
6. When the car is clean it moves to the glossy pick-up bay and the customer
   walks to the desk. Click the green **Collect Payout!** button, or press E
   near the desk, for the lump sum, the coin burst and the cha-ching.
7. Open the phone (📱) to buy tools, chemicals, plot upgrades and more adverts.
   Drive the van into the yellow **VAN UPGRADES** garage for sign writing,
   paint and the interior grid.

## The dirt layers

Each layer needs exactly this tool with exactly this chemical loaded. Pick the
chemical on the bar above the hotbar while the tool is equipped. Hovering
over dirt outlines it green or red to show whether your combination will work.

| Layer           | Tool                 | Chemical         | Per hit |
| --------------- | -------------------- | ---------------- | ------- |
| Heavy Mud       | High-Pressure Washer | Snow Foam        | £25     |
| Deep Scratches  | Rotary Polisher      | Cutting Compound | £75     |
| Interior Stains | Steam Extractor      | Fabric Cleaner   | £50     |
| Protective Seal | Drill Buffer         | Ceramic Coating  | £150    |

Customers only arrive with layers your business owns the kit for (mud is always
there), so buying new equipment unlocks bigger bills. Plot upgrades (Neon
Signage, Wash Bay Canopy, Coffee Kiosk) add a percentage to every hit.

The brief lists the Starter Detailing Kit as bucket, sponge and hose. The kit
here also includes an entry-level High-Pressure Washer and a bottle of Snow
Foam. Without them the first customer, whose car only has mud, couldn't be
cleaned, because mud needs the washer and foam. The bucket, sponge and hose
are prerequisites: the washer needs the hose, the polisher and buffer need
the sponge, and the steam extractor needs the bucket.

## Change things

- **Prices, rewards, tool list, adverts, props, plot upgrades:** the catalogue
  tables near the top of `GameServer` (`TOOLS`, `CHEMICALS`, `DIRT_LAYERS`,
  `ADVERTS`, `VAN_PROPS`, `PLOT_STRUCTURES`). The phone and panels read their
  prices from the server, so this is the only place to edit.
- **Starting cash, ranges, speeds, cooldowns:** the `CONFIG` table at the top of
  `GameServer`.
- **Sounds:** the scripts use Roblox's built-in engine sounds so they work
  out of the box. For a real cash register and pressure washer, upload your own
  audio and put the `rbxassetid://…` IDs in the `SOUNDS` table at the top of
  `GameClient` (and `UI_SOUNDS` in `InterfaceController`).
- **Look of the world:** everything is built from parts in the `buildPlot`,
  `buildVan` and `buildCustomerCar` functions in `GameServer`. Replace pieces
  with your own meshes, but keep the part names the scripts look up (the
  `Markers` folder, `Roof`, `KitButton`, `StoreZone`, `LeftWall`/`RightWall`,
  `RearDoor`, `CargoFloor`).

## How it stays secure

The client only ever asks. The server:

- keeps every price, and charges and pays from its own copy of the profile;
- re-casts every cleaning ray itself, from a believable camera position, and
  only counts a hit if the first thing the ray meets is dirt on the player's
  own customer car, within reach, with the right tool (one the server issued)
  and the right chemical loaded, no faster than the tool's fire rate;
- pays each job once: the job is marked paid before anything can yield, and
  the player must be at their own desk;
- filters the company name through `TextService` for broadcast, and again on
  every join;
- rate-limits every remote, type-checks every argument (including NaN and
  infinity), and rolls back a van that moves faster than it can drive;
- session-locks each profile so two servers can't both write it, saves through
  `UpdateAsync` only while it still holds the lock, and releases on leave and
  on shutdown.

## What isn't included

- Real meshes, textures and audio. The game is built from parts, and the
  sounds are engine placeholders.
- Monetisation (game passes, developer products).
- A real ProfileService dependency. The profile store is a self-contained
  implementation of the same ideas, so there is nothing to install.
