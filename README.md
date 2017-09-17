# ExpressChan
A lightweight imageboard written in express.js

## Setting up a database

Set up a postgresql database, and put your connection parameters in `settings.js`. To make a new board, call the async `Board.makeBoard();` with an instance of the desired board.

## Settings

Change the settings of the imageboard here.

### `db_*`

Connection parameters

### `admin_password_*`

Salt and hash for administrator password. Generate these, as well as a password, by running `node gen-password` in the root directory.

### `max_threads`

Maximum threads allowed threads

### `ban_unit`

Unit for bans. `'years'`, `'months'`, `'weeks'`, `'days'`, `'hours'`, `'minutes'`, `'seconds'`

### `require_image`

Require image for starting new thread.

### `min/max_chars`

Minimum / maximum characters in a post.

### `allowed_images`

Allowed image types.

### `max_filesize`

Maximum filesize in megabytes.

### `boards`

Array of objects describing each board.

#### `.description`

Description of board

#### `tripcode_enabled`

Are tripcodes shown / calculated

#### `password_*`

Salt and hash for moderator board password. Generate these, as well as a password, by running `node gen-password` in the root directory.
