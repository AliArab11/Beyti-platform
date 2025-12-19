using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BeytiDB.Migrations
{
    /// <inheritdoc />
    public partial class AddFavorites : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CustomerFavoriteSeller",
                columns: table => new
                {
                    CustomerId = table.Column<int>(type: "int", nullable: false),
                    SellerId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", precision: 3, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerFavoriteSeller", x => new { x.CustomerId, x.SellerId });
                    table.ForeignKey(
                        name: "FK_CustomerFavoriteSeller_Customer_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customer",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CustomerFavoriteSeller_Seller_SellerId",
                        column: x => x.SellerId,
                        principalTable: "Seller",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerFavoriteSeller_CustomerId",
                table: "CustomerFavoriteSeller",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerFavoriteSeller_CustomerId_SellerId",
                table: "CustomerFavoriteSeller",
                columns: new[] { "CustomerId", "SellerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CustomerFavoriteSeller_SellerId",
                table: "CustomerFavoriteSeller",
                column: "SellerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CustomerFavoriteSeller");
        }
    }
}
