import asyncio
import sys
import os
import getpass
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from database import async_session_maker, engine, Base
from models import User, UserRole
from auth import hash_password

async def promote_user(email: str):
    async with async_session_maker() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            print(f'Error: No user found with email "{email}"')
            return False
        if user.role == UserRole.admin:
            print(f'User "{user.name}" ({email}) is already an administrator.')
            return True
        user.role = UserRole.admin
        await db.commit()
        print(f'Success: Promoted "{user.name}" ({email}) to administrator.')
        return True

async def demote_user(email: str):
    async with async_session_maker() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            print(f'Error: No user found with email "{email}"')
            return False
        if user.role == UserRole.user:
            print(f'User "{user.name}" ({email}) is already a regular user.')
            return True
        user.role = UserRole.user
        await db.commit()
        print(f'Success: Demoted "{user.name}" ({email}) to regular user.')
        return True

async def list_admins():
    async with async_session_maker() as db:
        result = await db.execute(select(User).where(User.role == UserRole.admin).order_by(User.id))
        admins = result.scalars().all()
        if not admins:
            print('No administrators found.')
            return
        print(f'Found {len(admins)} administrator(s):')
        for a in admins:
            print(f'  • ID: {a.id} | Name: {a.name} | Email: {a.email}')

async def create_superuser_interactive():
    print('--- Create Andropedia Superuser (Interactive) ---')
    name = input('Name [Administrator]: ').strip() or 'Administrator'
    email = input('Email: ').strip()
    if not email:
        print('Error: Email cannot be empty.')
        return False

    password = getpass.getpass('Password: ')
    if not password:
        print('Error: Password cannot be empty.')
        return False

    confirm = getpass.getpass('Confirm Password: ')
    if password != confirm:
        print('Error: Passwords do not match.')
        return False

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as db:
        result = await db.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()
        hashed = hash_password(password)

        if existing:
            existing.name = name
            existing.password_hash = hashed
            existing.role = UserRole.admin
            await db.commit()
            print(f'Success: Updated existing user "{name}" ({email}) to administrator.')
        else:
            new_admin = User(
                name=name,
                email=email,
                password_hash=hashed,
                role=UserRole.admin,
            )
            db.add(new_admin)
            await db.commit()
            print(f'Success: Created new administrator "{name}" ({email}).')
        return True

def main():
    parser = argparse.ArgumentParser(description='Andropedia Administrator Management CLI')
    subparsers = parser.add_subparsers(dest='command', help='Commands')

    promote_parser = subparsers.add_parser('promote', help='Promote an existing registered user to admin')
    promote_parser.add_argument('email', help='Email of the user to promote')

    demote_parser = subparsers.add_parser('demote', help='Demote an admin to regular user')
    demote_parser.add_argument('email', help='Email of the user to demote')

    subparsers.add_parser('list', help='List all current administrators')
    subparsers.add_parser('createsuperuser', help='Interactively create an administrator with masked password')

    args = parser.parse_args()

    if args.command == 'promote':
        asyncio.run(promote_user(args.email))
    elif args.command == 'demote':
        asyncio.run(demote_user(args.email))
    elif args.command == 'list':
        asyncio.run(list_admins())
    elif args.command == 'createsuperuser':
        asyncio.run(create_superuser_interactive())
    else:
        parser.print_help()

if __name__ == '__main__':
    main()
