from django.core.management.base import BaseCommand
from django.core.management import call_command
from store.models import Product, Category

class Command(BaseCommand):
    help = 'Seeds initial data only if the database is fresh and empty'

    def handle(self, *args, **options):
        # If products or categories already exist, do NOT reload or overwrite!
        if Category.objects.exists() or Product.objects.exists():
            self.stdout.write(
                self.style.SUCCESS('Database already contains data. Skipping seeding to preserve your products.')
            )
            return

        self.stdout.write('Database is empty. Seeding initial catalog from fixture...')
        try:
            call_command('loaddata', 'store/fixtures/initial_data.json')
            self.stdout.write(self.style.SUCCESS('Successfully seeded initial catalog.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to seed initial catalog: {e}'))
