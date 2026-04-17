import { Pool } from "pg";
import { randomUUID } from "crypto";

const MEMBER_ROLES = new Set(["viewer", "editor", "owner"]);

function normalizeRole(role) {
  const v = String(role || "").trim().toLowerCase();
  return MEMBER_ROLES.has(v) ? v : null;
}

function toUser(row) {
  return {
    id: row.id,
    accountNo: Number(row.account_no || 0),
    email: row.email,
    displayName: row.display_name || "",
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at)
  };
}

function toBook(row) {
  return {
    id: row.id,
    name: row.name,
    ownerUserId: row.owner_user_id,
    payload: row.payload || {},
    version: Number(row.version || 1),
    role: row.role || "viewer",
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at)
  };
}

function toBookMember(row) {
  return {
    userId: row.user_id,
    accountNo: Number(row.account_no || 0),
    email: row.email,
    displayName: row.display_name || "",
    role: row.role,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at)
  };
}

export class CollabPostgresStore {
  constructor(connectionString) {
    this.pool = new Pool({ connectionString });
  }

  async init() {
    await this.pool.query(`
      create table if not exists collab_users (
        id text primary key,
        email text not null unique,
        account_no bigint,
        password_hash text not null,
        display_name text,
        created_at timestamptz not null default now()
      );
    `);

    await this.pool.query(`
      create sequence if not exists collab_user_account_seq start with 100001 increment by 1;
    `);

    await this.pool.query(`
      alter table collab_users
      add column if not exists account_no bigint;
    `);

    await this.pool.query(`
      alter table collab_users
      alter column account_no set default nextval('collab_user_account_seq');
    `);

    await this.pool.query(`
      with ranked as (
        select id,
               row_number() over(order by created_at asc, id asc) as rn
        from collab_users
        where account_no is null
      )
      update collab_users u
      set account_no = 100000 + ranked.rn
      from ranked
      where u.id = ranked.id;
    `);

    await this.pool.query(`
      select setval(
        'collab_user_account_seq',
        greatest(
          coalesce((select max(account_no) from collab_users), 100000),
          100000
        )
      );
    `);

    await this.pool.query(`
      create unique index if not exists collab_users_account_no_uidx on collab_users(account_no);
    `);

    await this.pool.query(`
      alter table collab_users
      alter column account_no set not null;
    `);

    await this.pool.query(`
      create table if not exists collab_books (
        id text primary key,
        name text not null,
        owner_user_id text not null references collab_users(id) on delete cascade,
        payload jsonb not null default '{}'::jsonb,
        version integer not null default 1,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `);

    await this.pool.query(`
      create table if not exists collab_book_members (
        book_id text not null references collab_books(id) on delete cascade,
        user_id text not null references collab_users(id) on delete cascade,
        role text not null,
        created_at timestamptz not null default now(),
        primary key (book_id, user_id)
      );
    `);
  }

  async getUserByEmail(email) {
    const result = await this.pool.query(
      "select id, account_no, email, display_name, password_hash, created_at from collab_users where lower(email)=lower($1)",
      [String(email || "").trim()]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      ...toUser(row),
      passwordHash: row.password_hash
    };
  }

  async getUserById(userId) {
    const result = await this.pool.query(
      "select id, account_no, email, display_name, created_at from collab_users where id = $1",
      [userId]
    );
    const row = result.rows[0];
    return row ? toUser(row) : null;
  }

  async updateUserDisplayName(userId, displayName) {
    const nextName = String(displayName || "").trim();
    if (!nextName) {
      throw new Error("昵称不能为空");
    }
    const result = await this.pool.query(
      `update collab_users
       set display_name = $2
       where id = $1
       returning id, account_no, email, display_name, created_at`,
      [String(userId || ""), nextName]
    );
    const row = result.rows[0];
    return row ? toUser(row) : null;
  }

  async getUserByAccountNo(accountNo) {
    const normalized = Number(accountNo);
    if (!Number.isInteger(normalized) || normalized <= 0) return null;
    const result = await this.pool.query(
      "select id, account_no, email, display_name, created_at from collab_users where account_no = $1",
      [normalized]
    );
    const row = result.rows[0];
    return row ? toUser(row) : null;
  }

  async createUser({ email, passwordHash, displayName }) {
    const user = {
      id: randomUUID(),
      email: String(email || "").trim().toLowerCase(),
      passwordHash: String(passwordHash || "").trim(),
      displayName: String(displayName || "").trim()
    };
    const result = await this.pool.query(
      `insert into collab_users (id, email, password_hash, display_name, account_no)
       values ($1, $2, $3, $4, nextval('collab_user_account_seq'))
       returning id, account_no, email, display_name, created_at`,
      [user.id, user.email, user.passwordHash, user.displayName || null]
    );
    return toUser(result.rows[0]);
  }

  async listBooksForUser(userId) {
    const result = await this.pool.query(
      `select b.id, b.name, b.owner_user_id, b.payload, b.version, b.created_at, b.updated_at, m.role
       from collab_books b
       join collab_book_members m on m.book_id = b.id
       where m.user_id = $1
       order by b.updated_at desc`,
      [userId]
    );
    return result.rows.map(toBook);
  }

  async getBookForUser(bookId, userId) {
    const result = await this.pool.query(
      `select b.id, b.name, b.owner_user_id, b.payload, b.version, b.created_at, b.updated_at, m.role
       from collab_books b
       join collab_book_members m on m.book_id = b.id
       where b.id = $1 and m.user_id = $2`,
      [bookId, userId]
    );
    const row = result.rows[0];
    return row ? toBook(row) : null;
  }

  async createBook({ userId, name, payload }) {
    const client = await this.pool.connect();
    const bookId = randomUUID();
    try {
      await client.query("begin");
      const created = await client.query(
        `insert into collab_books (id, name, owner_user_id, payload, version, created_at, updated_at)
         values ($1, $2, $3, $4::jsonb, 1, now(), now())
         returning id, name, owner_user_id, payload, version, created_at, updated_at`,
        [bookId, String(name || "未命名书籍").trim() || "未命名书籍", userId, JSON.stringify(payload || {})]
      );
      await client.query(
        `insert into collab_book_members (book_id, user_id, role)
         values ($1, $2, 'owner')`,
        [bookId, userId]
      );
      await client.query("commit");
      return { ...toBook(created.rows[0]), role: "owner" };
    } catch (err) {
      await client.query("rollback");
      throw err;
    } finally {
      client.release();
    }
  }

  async updateBook({ bookId, userId, name, payload, baseVersion }) {
    const member = await this.getBookForUser(bookId, userId);
    if (!member) throw new Error("无权限访问该书籍");
    if (!(member.role === "owner" || member.role === "editor")) {
      throw new Error("当前角色不允许编辑");
    }

    const nextName = name == null ? member.name : String(name || "").trim() || member.name;
    const nextPayload = payload && typeof payload === "object" ? payload : member.payload;
    const expectedVersion = Number(baseVersion);
    const useVersionCheck = Number.isFinite(expectedVersion) && expectedVersion > 0;

    const result = await this.pool.query(
      `update collab_books
       set name = $1,
           payload = $2::jsonb,
           version = version + 1,
           updated_at = now()
       where id = $3
         and ($4::boolean = false or version = $5)
       returning id, name, owner_user_id, payload, version, created_at, updated_at`,
      [nextName, JSON.stringify(nextPayload || {}), bookId, useVersionCheck, useVersionCheck ? expectedVersion : 0]
    );

    if (result.rowCount === 0) {
      throw new Error(useVersionCheck ? "版本冲突，请刷新后重试" : "书籍不存在");
    }

    return { ...toBook(result.rows[0]), role: member.role };
  }

  async deleteBook({ bookId, actorUserId }) {
    const actorBook = await this.getBookForUser(bookId, actorUserId);
    if (!actorBook || actorBook.role !== "owner") {
      throw new Error("仅书籍拥有者可删除");
    }
    const result = await this.pool.query("delete from collab_books where id = $1", [bookId]);
    return result.rowCount > 0;
  }

  async shareBook({ bookId, actorUserId, targetEmail, role }) {
    const nextRole = normalizeRole(role);
    if (!nextRole) throw new Error("共享角色不合法");
    const actorBook = await this.getBookForUser(bookId, actorUserId);
    if (!actorBook || (actorBook.role !== "owner" && actorBook.role !== "editor")) {
      throw new Error("当前角色不允许邀请成员");
    }
    if (actorBook.role === "editor" && nextRole !== "viewer") {
      throw new Error("编辑者仅可邀请仅读成员");
    }

    const targetEmailText = String(targetEmail || "").trim().toLowerCase();
    const target = targetEmailText
      ? await this.getUserByEmail(targetEmailText)
      : null;
    if (!target) {
      throw new Error("目标用户不存在，请确认昵称或邮箱");
    }

    await this.pool.query(
      `insert into collab_book_members (book_id, user_id, role)
       values ($1, $2, $3)
       on conflict (book_id, user_id)
       do update set role = excluded.role`,
      [bookId, target.id, nextRole]
    );

    return {
      bookId,
      userId: target.id,
      email: target.email,
      role: nextRole
    };
  }

  async shareBookByNickname({ bookId, actorUserId, targetNickname, role }) {
    const nickname = String(targetNickname || "").trim();
    if (!nickname) {
      throw new Error("昵称不能为空");
    }

    const users = await this.pool.query(
      `select id, account_no, email, display_name, created_at
       from collab_users
       where display_name = $1
       order by created_at asc`,
      [nickname]
    );
    if (users.rowCount === 0) {
      throw new Error("未找到该昵称用户，请确认对方已注册并设置昵称");
    }
    if (users.rowCount > 1) {
      throw new Error("该昵称对应多个用户，请改用邮箱邀请");
    }

    const target = toUser(users.rows[0]);
    return this.shareBook({
      bookId,
      actorUserId,
      targetEmail: target.email,
      role
    });
  }

  async shareBookByAccountNo({ bookId, actorUserId, targetAccountNo, role }) {
    const accountNo = Number(targetAccountNo);
    if (!Number.isInteger(accountNo) || accountNo <= 0) {
      throw new Error("数字账号不合法");
    }

    const target = await this.getUserByAccountNo(accountNo);
    if (!target) {
      throw new Error("未找到该数字账号用户");
    }

    return this.shareBook({
      bookId,
      actorUserId,
      targetEmail: target.email,
      role
    });
  }

  async listBookMembers({ bookId, userId }) {
    const actorBook = await this.getBookForUser(bookId, userId);
    if (!actorBook) {
      throw new Error("书籍不存在或无权限");
    }

    const result = await this.pool.query(
      `select m.book_id, m.user_id, m.role, m.created_at, u.account_no, u.email, u.display_name
       from collab_book_members m
       join collab_users u on u.id = m.user_id
       where m.book_id = $1
       order by case m.role when 'owner' then 1 when 'editor' then 2 else 3 end,
                m.created_at asc`,
      [bookId]
    );

    return {
      book: actorBook,
      members: result.rows.map(toBookMember)
    };
  }

  async updateBookMemberRole({ bookId, actorUserId, targetUserId, role }) {
    const nextRole = normalizeRole(role);
    if (!nextRole) {
      throw new Error("角色不合法");
    }

    const actorBook = await this.getBookForUser(bookId, actorUserId);
    if (!actorBook || actorBook.role !== "owner") {
      throw new Error("仅管理者可更改身份");
    }

    const targetMember = await this.pool.query(
      `select role from collab_book_members where book_id = $1 and user_id = $2`,
      [bookId, targetUserId]
    );
    if (targetMember.rowCount === 0) {
      throw new Error("目标成员不存在");
    }

    const prevRole = String(targetMember.rows[0].role || "viewer");
    if (prevRole === nextRole) {
      return this.listBookMembers({ bookId, userId: actorUserId });
    }

    if (prevRole === "owner" && nextRole !== "owner") {
      const ownerCountResult = await this.pool.query(
        `select count(*)::int as count
         from collab_book_members
         where book_id = $1 and role = 'owner'`,
        [bookId]
      );
      const ownerCount = Number(ownerCountResult.rows[0]?.count || 0);
      if (ownerCount <= 1) {
        throw new Error("至少保留一位管理者");
      }
    }

    await this.pool.query(
      `update collab_book_members
       set role = $1
       where book_id = $2 and user_id = $3`,
      [nextRole, bookId, targetUserId]
    );

    return this.listBookMembers({ bookId, userId: actorUserId });
  }

  async canAccessBook(bookId, userId) {
    const result = await this.pool.query(
      `select 1 from collab_book_members where book_id = $1 and user_id = $2`,
      [bookId, userId]
    );
    return result.rowCount > 0;
  }
}
