using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BeytiDB.Migrations
{
    /// <inheritdoc />
    public partial class AddDriverColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CurrentOfferedDriverId",
                table: "Driver",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "OfferExpiresAt",
                table: "Driver",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CurrentOfferedDriverId",
                table: "Driver");

            migrationBuilder.DropColumn(
                name: "OfferExpiresAt",
                table: "Driver");
        }
    }
}
