using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BeytiDB.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceCategorySeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "ServiceCategory",
                columns: new[] { "Id", "Name", "Description", "IsActive", "CreatedAt" },
                values: new object[,]
                {
                    { 1, "Plumbing", "Plumbing and pipe installation services", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, "Electrical", "Electrical installation and repair services", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 3, "Carpentry", "Woodwork and furniture services", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 4, "Painting", "Interior and exterior painting services", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 5, "Cleaning", "Professional cleaning services", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 6, "Tutoring", "Educational tutoring services", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 7, "Photography", "Photography and videography services", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 8, "Catering", "Food catering services", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 9, "Landscaping", "Garden and landscape maintenance", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 10, "HVAC", "Heating, ventilation, and air conditioning services", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 11, "Pest Control", "Pest management and extermination services", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 12, "Moving Services", "Relocation and moving assistance", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 13, "Other", "Other professional services", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ServiceCategory",
                keyColumn: "Id",
                keyValues: new object[] { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 });
        }
    }
}
