using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BeytiDB.Migrations
{
    /// <inheritdoc />
    public partial class AddSellerAvailability : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<TimeSpan>(
                name: "CloseTime",
                table: "Seller",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsManuallyClosed",
                table: "Seller",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "OpenTime",
                table: "Seller",
                type: "time",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CloseTime",
                table: "Seller");

            migrationBuilder.DropColumn(
                name: "IsManuallyClosed",
                table: "Seller");

            migrationBuilder.DropColumn(
                name: "OpenTime",
                table: "Seller");
        }
    }
}
