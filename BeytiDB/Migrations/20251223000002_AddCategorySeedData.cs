using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BeytiDB.Migrations
{
    /// <inheritdoc />
    public partial class AddCategorySeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Category",
                columns: new[] { "Id", "Name", "Description", "IsActive", "CreatedAt" },
                values: new object[,]
                {
                    { 1, "Electronics", "Electronic devices and accessories", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, "Fashion & Clothing", "Apparel and fashion items", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 3, "Home & Garden", "Home improvement and garden supplies", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 4, "Sports & Outdoors", "Sports equipment and outdoor gear", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 5, "Books & Media", "Books, music, movies, and media", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 6, "Food & Beverages", "Food products and beverages", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 7, "Beauty & Personal Care", "Beauty products and personal care items", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 8, "Toys & Games", "Toys, games, and entertainment", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 9, "Automotive", "Auto parts and accessories", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 10, "Other", "Other products", true, new DateTime(2025, 12, 23, 0, 0, 0, 0, DateTimeKind.Utc) }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Category",
                keyColumn: "Id",
                keyValues: new object[] { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 });
        }
    }
}
